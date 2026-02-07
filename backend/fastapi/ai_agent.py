"""
Financial AI Agent using Dedalus Labs reasoning model.

Architecture:
  User Query → Intent Mapping (Router) → Specialized Handler (Data/Advice/General)

Improvements:
  - Router-Resolver Architecture for better accuracy
  - Deterministic Math for data retrieval (Python, not LLM)
  - Context Scoping to reduce token usage and confusion
"""

import os
import sys
import json
import re
import asyncio
from enum import Enum
from pathlib import Path
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
from pydantic import BaseModel
from dotenv import load_dotenv
import pandas as pd
import numpy as np

# Ensure current directory is in path
sys.path.insert(0, str(Path(__file__).parent))

# Load .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

try:
    from dedalus_labs import AsyncDedalus, DedalusRunner
    HAS_DEDALUS = True
except ImportError:
    HAS_DEDALUS = False
    print("⚠️  dedalus_labs not installed – AI Agent will use fallback responses")


# ==================== PYDANTIC MODELS ====================

class ChatRequest(BaseModel):
    message: str
    conversation_history: list = []


class ChatResponse(BaseModel):
    response: str
    tool_calls: list = []
    reasoning: str = ""


# ==================== DATA ACCESS LAYER ====================

def _load_data() -> dict:
    """Load persisted data from data.json (shared with main.py)."""
    data_file = Path(__file__).parent / 'data.json'
    if data_file.exists():
        try:
            with open(data_file, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {'transactions': [], 'category_budgets': {}, 'default_budget': 3000.0}


# ==================== DETERMINISTIC TOOLS (PYTHON LOGIC) ====================

def filter_transactions(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic transaction filter.
    Executes precise filtering logic based on parameters.
    Sorts results by date descending so "last transaction" is first.
    """
    data = _load_data()
    transactions = data.get('transactions', [])

    filtered = transactions
    
    # 1. Filter by Merchant (contains, case-insensitive)
    if params.get("merchant_contains"):
        term = params["merchant_contains"].lower()
        filtered = [t for t in filtered if term in t.get("merchant", "").lower()]
        
    # 2. Filter by Category (exact or contains)
    if params.get("category"):
        cat_term = params["category"].lower()
        filtered = [t for t in filtered if cat_term in t.get("category", "").lower()]
        
    # 3. Filter by Date Range
    now = datetime.utcnow()
    date_range = params.get("date_range")
    
    if date_range:
        cutoff = None
        if date_range == "last_week":
            cutoff = now - timedelta(days=7)
        elif date_range == "last_month":
            cutoff = now - timedelta(days=30)
        elif date_range == "last_3_months":
            cutoff = now - timedelta(days=90)
        elif date_range == "last_year":
            cutoff = now - timedelta(days=365)
            
        if cutoff:
            filtered_by_date = []
            for t in filtered:
                try:
                    t_date = datetime.fromisoformat(t.get("date", ""))
                except:
                    try:
                        t_date = datetime.strptime(t.get("date", ""), "%Y-%m-%d")
                    except:
                        continue # Skip invalid dates if range filtering
                
                if t_date >= cutoff:
                    filtered_by_date.append(t)
            filtered = filtered_by_date

    # 4. Filter by Amount
    if params.get("min_amount"):
        filtered = [t for t in filtered if float(t.get("amount", 0)) >= float(params["min_amount"])]
    if params.get("max_amount"):
        filtered = [t for t in filtered if float(t.get("amount", 0)) <= float(params["max_amount"])]

    # 5. Sort by date descending (most recent first)
    def _parsed_date(t: Dict[str, Any]):
        try:
            return datetime.fromisoformat(t.get("date", ""))
        except Exception:
            try:
                return datetime.strptime(t.get("date", ""), "%Y-%m-%d")
            except Exception:
                return datetime.min

    filtered = sorted(filtered, key=_parsed_date, reverse=True)

    # Calculate Aggregates
    total_amount = sum(float(t.get("amount", 0)) for t in filtered)
    count = len(filtered)
    
    # Latest transaction (after sort)
    latest_txn = filtered[0] if filtered else None

    # Get top merchants in this slice
    merchants = {}
    for t in filtered:
        m = t.get("merchant", "Unknown")
        merchants[m] = merchants.get(m, 0) + float(t.get("amount", 0))
    
    top_merchants = sorted(merchants.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        "count": count,
        "total_amount": round(total_amount, 2),
        "transactions": filtered, # potentially limit this if list is huge
        "top_merchants": top_merchants,
        "latest_transaction": latest_txn
    }

def get_budget_summary_data() -> Dict[str, Any]:
    """Get high-level budget health data."""
    data = _load_data()
    default_budget = float(data.get('default_budget', 3000.0))
    transactions = data.get('transactions', [])
    
    total_spent = sum(float(t.get('amount', 0)) for t in transactions)
    
    # Simple category breakdown
    cat_spend = {}
    for t in transactions:
        c = t.get('category', 'Uncategorized')
        cat_spend[c] = cat_spend.get(c, 0) + float(t.get('amount', 0))
        
    top_cats = sorted(cat_spend.items(), key=lambda x: x[1], reverse=True)[:3]
    
    return {
        "total_budget": default_budget,
        "total_spent": round(total_spent, 2),
        "remaining": round(default_budget - total_spent, 2),
        "top_categories": top_cats,
        "percent_used": round((total_spent / default_budget) * 100, 1) if default_budget else 0
    }

def get_advanced_stats() -> Dict[str, Any]:
    """
    Calculate statistical metrics: Volatility, Z-Score Anomalies, Trends.
    Used by the Advisor to give data-backed financial coaching.
    """
    data_full = _load_data()
    transactions = data_full.get('transactions', [])
    
    if not transactions:
        return {}
    
    # Convert to Pandas for vector math
    df = pd.DataFrame(transactions)
    # Ensure amount is numeric
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
    
    # 1. Volatility per Category (Coefficient of Variation)
    # CV = StdDev / Mean. High CV (>0.5) means "Chaos/Discretionary". Low CV means "Fixed/Bills".
    if 'category' in df.columns and not df.empty:
        cat_stats = df.groupby('category')['amount'].agg(['mean', 'std', 'count'])
        # Filter sparse categories (need >2 txns for std dev)
        cat_stats = cat_stats[cat_stats['count'] > 2].copy()
        
        cat_stats['volatility'] = cat_stats['std'] / cat_stats['mean']
        
        # Identify interesting clusters
        highly_volatile = cat_stats[cat_stats['volatility'] > 0.5].index.tolist()
        stable_bills = cat_stats[cat_stats['volatility'] < 0.2].index.tolist()
    else:
        highly_volatile = []
        stable_bills = []
        cat_stats = pd.DataFrame()

    # 2. Z-Score Anomaly Detection
    # Flag transactions that are > 2 standard deviations from the category mean
    recent_anomalies = []
    
    # Analyze only recent 10 txns for immediate advice context
    recent_txns = df.tail(10).copy()
    
    for _, row in recent_txns.iterrows():
        cat = row.get('category')
        amt = row.get('amount', 0)
        
        if cat in cat_stats.index:
            mu = cat_stats.loc[cat, 'mean']
            sigma = cat_stats.loc[cat, 'std']
            
            # If sigma is tiny, any deviation is huge, so ignore strict zero sigma
            if sigma > 1.0: 
                z_score = (amt - mu) / sigma
                if z_score > 2.0:
                    recent_anomalies.append({
                        "merchant": row.get('merchant'),
                        "amount": amt,
                        "category": cat,
                        "z_score": round(z_score, 1),
                        "message": f"${amt} is {round(z_score, 1)}x standard deviations high for {cat}"
                    })

    # 3. Burn Rate Analysis
    total_spent = df['amount'].sum()
    stats_summary = {
        "monthly_burn_rate": round(total_spent, 2), # Simplified (assumes 1 month data window for now)
        "volatile_categories": highly_volatile,
        "stable_categories": stable_bills,
        "recent_anomalies": recent_anomalies,
        "transaction_count": len(df)
    }
    
    return stats_summary

# ==================== INTENTS & PROMPTS ====================

class Intent(str, Enum):
    DATA_RETRIEVAL = "DATA_RETRIEVAL"  # Specific queries: "How much did I spend on Uber?"
    ANALYSIS = "ANALYSIS"              # Broad questions: "Am I over budget?"
    ADVICE = "ADVICE"                  # Strategic: "How do I save more?"
    GENERAL = "GENERAL"                # Chat: "Hi", "Who are you?"

ROUTER_PROMPT = """
Analyze the user's financial query and classify it into exactly one of these categories:
1. DATA_RETRIEVAL: User asks for specific numbers, transaction history, sums, or filters (e.g., "How much did I spend on food?", "List my Uber trips", "transactions last week").
2. ANALYSIS: User asks about budget health, trends, status, or comparisons (e.g., "Am I spending more than last month?", "What is my highest category?", "Am I broke?").
3. ADVICE: User asks for help, recommendations, planning, or future guidance (e.g., "How can I save money?", "Create a budget for me", "Can I afford this?").
4. GENERAL: Greetings, non-financial questions, or vague chatter.

Return strictly a JSON object: {"intent": "CATEGORY_NAME", "reasoning": "brief explanation"}
"""

DATA_PARAM_EXTRACTION_PROMPT = """
You are a Data Extraction Specialist.
Your goal is to extract filter parameters from the user's query to query the database.

User Query: "{query}"

Return ONLY a JSON object with these fields (use null if not specified):
{{
  "merchant_contains": "string or null",
  "category": "string or null", 
  "date_range": "last_week" | "last_month" | "last_3_months" | "last_year" | null,
  "min_amount": number | null,
  "max_amount": number | null
}}
"""

ADVISORY_PROMPT = """
You are a Senior Financial Planner.

Context:
{context}

User Query: {query}

Instructions:
1. Analyze the provided financial context deeply.
2. Identify root causes of spending issues if any.
3. LOOK FOR "statistical_analysis" in the context:
   - Mention "Highly Volatile" categories as areas where spending is erratic.
   - Mention "Stable" categories as fixed costs.
   - Point out specific "Recent Anomalies" (Z-Score > 2.0) if they exist.
4. Provide 3 concrete, actionable steps.
5. Use a professional but empathetic tone.
"""

# ==================== HANDLERS ====================

async def determine_intent(user_query: str, client: Any) -> Dict[str, str]:
    """Step 1: The Router - Classifies user intent."""
    try:
        response = await client.run(
            input=ROUTER_PROMPT + f"\n\nUser Query: {user_query}",
            model="anthropic/claude-opus-4-6"
        )
        
        # Heuristic to cleanup response
        output = str(response.final_output).strip()
        cleaned = re.sub(r'```json\\s*|\\s*```', '', output)
        return json.loads(cleaned)
    except Exception as e:
        print(f"⚠️ Router Error: {e}")
        # Local intent heuristic fallback
        intent = _classify_intent_heuristic(user_query)
        return {"intent": intent, "reasoning": "Heuristic routing due to LLM error"}

async def handle_data_retrieval(user_query: str, client: Any) -> ChatResponse:
    """
    Workflow A: Deterministic Data Retrieval.
    1. Extract params using LLM.
    2. Run Python filtering.
    3. Return precise answer using LLM to naturalize.
    """
    # 1. Extract params
    formatted_prompt = DATA_PARAM_EXTRACTION_PROMPT.format(query=user_query)
    response = await client.run(
        input=formatted_prompt,
        model="anthropic/claude-opus-4-6"
    )
    
    try:
        output = str(response.final_output).strip()
        cleaned = re.sub(r'```json\\s*|\\s*```', '', output)
        params = json.loads(cleaned)
    except:
        params = {}
    
    print(f"🔍 Extracted Params: {params}")

    # 2. Run Python Code (Deterministic)
    result = filter_transactions(params)
    
    # 3. Format Response
    latest = result.get('latest_transaction')
    latest_str = ""
    if latest:
        latest_str = (
            f"Latest: {latest.get('date')} — {latest.get('merchant')} — "
            f"${abs(float(latest.get('amount', 0))):,.2f} "
            f"({'deposit' if float(latest.get('amount', 0)) > 0 else 'withdrawal'})\n"
        )

    summary = f"""
    Found {result['count']} transactions.
    Total Amount (signed): ${result['total_amount']}\n
    {latest_str}Top Merchants: {result['top_merchants']}
    """
    
    final_prompt = f"""
    User asked: "{user_query}"
    Database returned: {summary}
    
    Answer the user's question concisely based EXACTLY on this data.
    """
    
    final_res = await client.run(
        input=final_prompt,
        model="anthropic/claude-opus-4-6"
    )
    
    return ChatResponse(
        response=str(final_res.final_output),
        tool_calls=[{"tool": "filter_transactions", "args": params}],
        reasoning="Deterministic Data Retrieval"
    )

async def handle_advice(user_query: str, client: Any, intent: str) -> ChatResponse:
    """
    Workflow B: Deep Analysis & Advice.
    Uses context scoping to provide relevant summaries.
    """
    # 1. Build Scoped Context
    # For advice, we need high-level health + recent trends
    budget_data = get_budget_summary_data()
    advanced_stats = get_advanced_stats()
    
    # Merge contexts
    full_context = {
        "budget_summary": budget_data,
        "statistical_analysis": advanced_stats
    }
    
    context_str = json.dumps(full_context, indent=2)
    
    # 2. Run Advisor
    formatted_prompt = ADVISORY_PROMPT.format(context=context_str, query=user_query)
    
    response = await client.run(
        input=formatted_prompt,
        model="anthropic/claude-opus-4-6" # Intelligent model
    )
    
    return ChatResponse(
        response=str(response.final_output),
        tool_calls=[{"tool": "get_advanced_stats", "args": {}}],
        reasoning=f"High-level Advisory ({intent})"
    )

async def handle_general(user_query: str, client: Any) -> ChatResponse:
    """Workflow C: General/Chit-chat with safe fallback"""
    try:
        response = await client.run(
            input=f"User said: {user_query}. Respond helpfully and briefly. You are a financial assistant.",
            model="anthropic/claude-opus-4-6"
        )
        return ChatResponse(
            response=str(response.final_output),
            tool_calls=[],
            reasoning="General Chat"
        )
    except Exception as e:
        print(f"⚠️ General chat failed: {e}")
        help_text = (
            "Hi! I can help with:\n\n"
            "• Spending analysis — 'Where did my money go?'\n"
            "• Budget health — 'Am I on budget?'\n"
            "• Affordability — 'Can I afford a $200 purchase?'\n"
            "• Recent transactions — 'Show my latest transactions'\n"
            "• Cashflow projection — 'How will I end the month?'\n"
        )
        return ChatResponse(response=help_text, tool_calls=[], reasoning="Local fallback help")

def _classify_intent_heuristic(user_query: str) -> str:
    q = user_query.lower()
    if any(w in q for w in ["how much", "spent", "spend", "transactions", "list", "show", "search"]):
        return str(Intent.DATA_RETRIEVAL)
    if any(w in q for w in ["where did my money", "over budget", "status", "trend", "highest category", "budget health"]):
        return str(Intent.ANALYSIS)
    if any(w in q for w in ["save", "afford", "plan", "recommend", "advice", "budget for"]):
        return str(Intent.ADVICE)
    return str(Intent.GENERAL)

# ==================== MAIN ENTRY POINT ====================

async def chat_with_ai(user_message: str, conversation_history: list = []) -> ChatResponse:
    """
    Main Entry Point.
    Routes → Resolves → Returns.
    """
    if not HAS_DEDALUS:
        return ChatResponse(
            response="AI features unavailable (Dedalus not installed).", 
            reasoning="Missing dependencies"
        )
    
    # Check API key again to be safe
    if not os.environ.get('DEDALUS_API_KEY'):
         return ChatResponse(
            response="Please configure DEDALUS_API_KEY.", 
            reasoning="Missing API Key"
        )

    client = AsyncDedalus()
    runner = DedalusRunner(client)
    
    print(f"🚀 Processing: {user_message}")

    # 1. ROUTE
    routing = await determine_intent(user_message, runner)
    intent = routing.get("intent", Intent.GENERAL)
    print(f"🚦 Intent Detected: {intent}")

    # 2. RESOLVE
    if intent == Intent.DATA_RETRIEVAL:
        return await handle_data_retrieval(user_message, runner)
    
    elif intent in [Intent.ADVICE, Intent.ANALYSIS]:
        return await handle_advice(user_message, runner, intent)
    
    else:
        return await handle_general(user_message, runner)
