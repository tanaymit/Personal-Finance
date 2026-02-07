from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import traceback
import sys
from datetime import datetime
from pathlib import Path
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from dotenv import load_dotenv

# Ensure current directory is in path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Load .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

from receipt_extractor import ReceiptExtractor
from assistant_runtime import (
    get_spending_summary,
    get_budget_status,
    get_cashflow_projection,
    get_category_spend,
    get_transaction_detail,
    simulate_purchase,
    detect_anomalies,
    get_recurring_transactions,
    tier0_response,
    plan_tool_calls,
    answer_with_facts,
)
import json

# JSON-based persistence
data_file = Path(__file__).parent / 'data.json'


def _norm_text(value: Optional[str]) -> str:
    if value is None:
        return ''
    return ' '.join(str(value).strip().lower().split())


def _amount_key(value: Any) -> str:
    try:
        d = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        # Normalize -0.00 -> 0.00
        if d == Decimal('-0.00'):
            d = Decimal('0.00')
        return format(d, 'f')
    except (InvalidOperation, ValueError, TypeError):
        return '0.00'


def _tx_fingerprint_from_parts(date: str, merchant: str, amount: Any, description: Optional[str]) -> str:
    # Purpose: stable de-dupe key across repeated imports.
    # Intentionally excludes category so category mapping improvements can upsert.
    return '|'.join(
        [
            str(date or '').strip(),
            _norm_text(merchant),
            _amount_key(amount),
            _norm_text(description),
        ]
    )


def _tx_fingerprint(t: Dict[str, Any]) -> str:
    return _tx_fingerprint_from_parts(
        t.get('date', ''),
        t.get('merchant', ''),
        t.get('amount', 0),
        t.get('description'),
    )


def _dedupe_transactions_in_place(items: List[Dict[str, Any]]) -> int:
    seen: set[str] = set()
    deduped: List[Dict[str, Any]] = []
    removed = 0
    for t in items:
        fp = _tx_fingerprint(t)
        if fp in seen:
            removed += 1
            continue
        seen.add(fp)
        deduped.append(t)
    if removed:
        items[:] = deduped
    return removed

def load_data():
    """Load transactions and settings from JSON file."""
    if data_file.exists():
        try:
            with open(data_file, 'r') as f:
                data = json.load(f)
                # Backwards compatible: allow older files without goals
                return (
                    data.get('transactions', []),
                    data.get('category_budgets', {}),
                    data.get('default_budget', 3000.0),
                    data.get('goals', []),
                )
        except Exception as e:
            print(f"⚠️  Failed to load data: {e}")
    return [], {}, 3000.0, []

def save_data():
    """Save transactions and settings to JSON file."""
    try:
        data = {
            'transactions': transactions,
            'category_budgets': category_budgets,
            'default_budget': default_budget,
            'goals': goals,
        }
        with open(data_file, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"❌ Failed to save data: {e}")

# Load data on startup
transactions, category_budgets, default_budget, goals = load_data()

# One-time cleanup: if prior imports duplicated rows, collapse them now.
removed_dupes = _dedupe_transactions_in_place(transactions)
if removed_dupes:
    save_data()
    print(f"🧹 Removed {removed_dupes} duplicate transactions")
print(f"✅ Loaded {len(transactions)} transactions, default budget: {default_budget}")

app = FastAPI(title="Personal Finance Mock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionIn(BaseModel):
    date: str
    merchant: str
    amount: float
    category: str
    description: Optional[str] = None

class Transaction(TransactionIn):
    id: str

class Category(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    budgetLimit: Optional[float] = None
    spent: Optional[float] = 0


class GoalIn(BaseModel):
    name: str
    targetAmount: float
    targetDate: Optional[str] = None
    note: Optional[str] = None


class Goal(GoalIn):
    id: str
    createdAt: str


class AssistantChatRequest(BaseModel):
    message: str
    year: Optional[int] = None
    month: Optional[int] = None
    startingBalance: Optional[float] = 0.0


def _amount_as_float(t: dict) -> float:
    try:
        return float(t.get('amount') or 0)
    except Exception:
        return 0.0


def _is_expense(t: dict) -> bool:
    # Convention: expenses are positive; income/refunds are negative
    return _amount_as_float(t) > 0

@app.get('/transactions', response_model=List[Transaction])
def list_transactions(year: Optional[int] = None, month: Optional[int] = None):
    if year is None and month is None:
        return transactions
    
    filtered = []
    for t in transactions:
        try:
            date_str = t.get('date', '')
            if date_str:
                date_parts = date_str.split('-')
                t_year = int(date_parts[0])
                t_month = int(date_parts[1])
                
                if year and t_year != year:
                    continue
                if month and t_month != month:
                    continue
                    
                filtered.append(t)
        except (ValueError, IndexError):
            continue
    
    return filtered

@app.get('/transactions/{transaction_id}', response_model=Transaction)
def get_transaction(transaction_id: str):
    for t in transactions:
        if t['id'] == transaction_id:
            return t
    raise HTTPException(status_code=404, detail='Transaction not found')

@app.post('/transactions', response_model=Transaction)
def create_transaction(tx: TransactionIn):
    fp = _tx_fingerprint_from_parts(tx.date, tx.merchant, tx.amount, tx.description)
    for existing in transactions:
        if _tx_fingerprint(existing) == fp:
            updated = False
            # Upsert mutable fields (category mapping can improve over time)
            incoming = tx.dict()
            for key, value in incoming.items():
                if existing.get(key) != value:
                    existing[key] = value
                    updated = True
            if updated:
                save_data()
            return existing

    # Use UUIDs for transaction IDs to avoid collisions
    new_id = uuid.uuid4().hex
    new = {"id": new_id, **tx.dict()}
    transactions.insert(0, new)
    save_data()
    return new


@app.post('/transactions/bulk', response_model=List[Transaction])
def create_transactions_bulk(payload: List[TransactionIn]):
    # Make bulk import idempotent: repeated imports won't create duplicates.
    # Return a list matching the input length (existing or newly created).
    existing_by_fp: Dict[str, Dict[str, Any]] = {}
    for t in transactions:
        existing_by_fp[_tx_fingerprint(t)] = t

    results: List[dict] = []
    changed = False

    for tx in payload:
        fp = _tx_fingerprint_from_parts(tx.date, tx.merchant, tx.amount, tx.description)
        existing = existing_by_fp.get(fp)

        if existing is not None:
            incoming = tx.dict()
            for key, value in incoming.items():
                if existing.get(key) != value:
                    existing[key] = value
                    changed = True
            results.append(existing)
            continue

        new_id = uuid.uuid4().hex
        new = {"id": new_id, **tx.dict()}
        transactions.insert(0, new)
        existing_by_fp[fp] = new
        results.append(new)
        changed = True

    if changed:
        save_data()
    return results


@app.get('/goals', response_model=List[Goal])
def list_goals():
    return goals


@app.post('/goals', response_model=Goal)
def create_goal(payload: GoalIn):
    g = {
        'id': uuid.uuid4().hex,
        'name': payload.name,
        'targetAmount': float(payload.targetAmount),
        'targetDate': payload.targetDate,
        'note': payload.note,
        'createdAt': datetime.utcnow().isoformat(),
    }
    goals.append(g)
    save_data()
    return g


@app.delete('/goals/{goal_id}')
def delete_goal(goal_id: str):
    global goals
    before = len(goals)
    goals = [g for g in goals if str(g.get('id')) != str(goal_id)]
    if len(goals) == before:
        raise HTTPException(status_code=404, detail='Goal not found')
    save_data()
    return {'ok': True}


@app.get('/assistant/spending-summary')
def assistant_spending_summary(year: Optional[int] = None, month: Optional[int] = None):
    return get_spending_summary(transactions, year, month)


@app.get('/assistant/budget-status')
def assistant_budget_status(year: Optional[int] = None, month: Optional[int] = None):
    return get_budget_status(transactions, float(default_budget), category_budgets, year, month)


@app.get('/assistant/cashflow-projection')
def assistant_cashflow_projection(year: Optional[int] = None, month: Optional[int] = None, startingBalance: float = 0.0):
    return get_cashflow_projection(transactions, year, month, starting_balance=float(startingBalance))


@app.get('/assistant/category-spend')
def assistant_category_spend(category: str, year: Optional[int] = None, month: Optional[int] = None):
    return get_category_spend(transactions, category, year, month)


@app.get('/assistant/transaction/{transaction_id}')
def assistant_transaction_detail(transaction_id: str):
    return get_transaction_detail(transactions, transaction_id)


@app.get('/assistant/anomalies')
def assistant_anomalies(year: Optional[int] = None, month: Optional[int] = None, limit: int = 3):
    return detect_anomalies(transactions, year, month, limit=limit)


@app.get('/assistant/recurring')
def assistant_recurring():
    return get_recurring_transactions(transactions)


@app.post('/assistant/simulate-purchase')
def assistant_simulate_purchase(payload: Dict[str, Any]):
    amt = float(payload.get('amount') or 0)
    cat = str(payload.get('category') or 'Other')
    year = payload.get('year')
    month = payload.get('month')
    starting_balance = float(payload.get('startingBalance') or 0.0)
    return simulate_purchase(
        transactions,
        float(default_budget),
        category_budgets,
        amt,
        cat,
        year=year,
        month=month,
        starting_balance=starting_balance,
    )


@app.post('/assistant/chat')
async def assistant_chat(req: AssistantChatRequest):
    quick = tier0_response(req.message)
    if quick:
        return {
            'tier': 0,
            'toolPlan': None,
            'facts': None,
            'answer': quick,
        }

    try:
        tool_plan = await plan_tool_calls(req.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant planner failed: {str(e)}")
    calls = tool_plan.get('calls') or []
    facts: Dict[str, Any] = {
        'periodDefault': 'current_month',
        'calls': [],
    }

    for c in calls:
        tool = (c.get('tool') or '').strip()
        args = c.get('args') or {}

        if tool == 'get_spending_summary':
            out = get_spending_summary(transactions, args.get('year', req.year), args.get('month', req.month))
        elif tool == 'get_budget_status':
            out = get_budget_status(transactions, float(default_budget), category_budgets, args.get('year', req.year), args.get('month', req.month))
        elif tool == 'get_cashflow_projection':
            out = get_cashflow_projection(
                transactions,
                args.get('year', req.year),
                args.get('month', req.month),
                starting_balance=float(args.get('startingBalance', req.startingBalance or 0.0)),
            )
        elif tool == 'get_category_spend':
            out = get_category_spend(
                transactions,
                str(args.get('category') or ''),
                args.get('year', req.year),
                args.get('month', req.month),
            )
        elif tool == 'get_transaction_detail':
            out = get_transaction_detail(transactions, str(args.get('id') or ''))
        elif tool == 'simulate_purchase':
            out = simulate_purchase(
                transactions,
                float(default_budget),
                category_budgets,
                float(args.get('amount') or 0.0),
                str(args.get('category') or 'Other'),
                year=args.get('year', req.year),
                month=args.get('month', req.month),
                starting_balance=float(args.get('startingBalance', req.startingBalance or 0.0)),
            )
        elif tool == 'detect_anomalies':
            out = detect_anomalies(
                transactions,
                args.get('year', req.year),
                args.get('month', req.month),
                limit=int(args.get('limit') or 3),
            )
        elif tool == 'get_recurring_transactions':
            out = get_recurring_transactions(transactions)
        elif tool == 'get_user_goals':
            out = {'goals': goals}
        else:
            out = {'error': f'Unknown tool: {tool}'}

        facts['calls'].append({'tool': tool, 'args': args, 'result': out})

    try:
        answer = await answer_with_facts(req.message, facts, style=tool_plan.get('answerStyle', 'short'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant reasoning failed: {str(e)}")
    return {
        'tier': tool_plan.get('tier', 1),
        'toolPlan': tool_plan,
        'facts': facts,
        'answer': answer,
    }

@app.get('/categories', response_model=List[Category])
def list_categories(year: Optional[int] = None, month: Optional[int] = None):
    # Filter transactions by year/month if provided
    filtered_transactions = transactions
    if year is not None or month is not None:
        filtered_transactions = []
        for t in transactions:
            try:
                date_str = t.get('date', '')
                if date_str:
                    date_parts = date_str.split('-')
                    t_year = int(date_parts[0])
                    t_month = int(date_parts[1])
                    
                    if year and t_year != year:
                        continue
                    if month and t_month != month:
                        continue
                        
                    filtered_transactions.append(t)
            except (ValueError, IndexError):
                continue
    
    # Build categories from filtered transactions (expenses only)
    grouped = {}
    for t in filtered_transactions:
        if not _is_expense(t):
            continue
        cat = t.get('category') or 'Uncategorized'
        grouped.setdefault(cat, 0.0)
        try:
            grouped[cat] += float(t.get('amount') or 0)
        except Exception:
            pass

    categories = []
    for name, spent in grouped.items():
        # create stable id from name
        cid = uuid.uuid5(uuid.NAMESPACE_DNS, name).hex
        categories.append({
            'id': cid,
            'name': name,
            'icon': None,
            'color': None,
            'budgetLimit': category_budgets.get(name),
            'spent': spent
        })
    return categories

@app.get('/budget-summary')
def budget_summary(year: Optional[int] = None, month: Optional[int] = None):
    # Filter transactions by year/month if provided
    filtered_transactions = transactions
    if year is not None or month is not None:
        filtered_transactions = []
        for t in transactions:
            try:
                date_str = t.get('date', '')
                if date_str:
                    date_parts = date_str.split('-')
                    t_year = int(date_parts[0])
                    t_month = int(date_parts[1])
                    
                    if year and t_year != year:
                        continue
                    if month and t_month != month:
                        continue
                        
                    filtered_transactions.append(t)
            except (ValueError, IndexError):
                continue
    
    # totalBudget is the user-configurable default_budget
    total_budget = float(default_budget or 0.0)
    # totalSpent is sum of expense transactions only
    total_spent = 0.0
    by_cat = {}
    for t in filtered_transactions:
        amt = _amount_as_float(t)
        if amt <= 0:
            continue
        total_spent += amt
        cat = t.get('category') or 'Uncategorized'
        by_cat.setdefault(cat, 0.0)
        by_cat[cat] += amt

    # largest category by spent
    largest_category = None
    largest_amount = 0.0
    for cat, amt in by_cat.items():
        if amt > largest_amount:
            largest_amount = amt
            largest_category = cat

    return {
        'totalBudget': total_budget,
        'totalSpent': total_spent,
        'remainingBudget': total_budget - total_spent,
        'largestCategory': largest_category,
        'largestCategoryAmount': largest_amount,
    }


@app.get('/budget')
def get_budget():
    return {'defaultBudget': float(default_budget)}


@app.put('/budget')
def set_budget(payload: dict):
    global default_budget
    try:
        v = float(payload.get('defaultBudget'))
        default_budget = v
        save_data()
        return {'defaultBudget': default_budget}
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid budget value')


@app.put('/categories/{category_key}')
def set_category_budget(category_key: str, payload: dict):
    # Accept either category name or category id (uuid5(name)).
    try:
        v = payload.get('budgetLimit')
        if v is None:
            raise ValueError('missing')

        # Resolve key -> name
        name = None
        # 1) Direct name match
        for t in transactions:
            if (t.get('category') or '') == category_key:
                name = category_key
                break

        # 2) Try as uuid5(name)
        if name is None:
            # Scan known categories from expense transactions
            seen = set()
            for t in transactions:
                if not _is_expense(t):
                    continue
                cat = t.get('category') or 'Uncategorized'
                if cat in seen:
                    continue
                seen.add(cat)
                cid = uuid.uuid5(uuid.NAMESPACE_DNS, cat).hex
                if cid == category_key:
                    name = cat
                    break

        if name is None:
            # Fallback: allow setting budget for a new category by name
            name = category_key

        category_budgets[name] = float(v)
        save_data()
        return {'name': name, 'budgetLimit': category_budgets[name]}
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid category budget')

@app.post('/upload-receipt')
async def upload_receipt(file: UploadFile = File(...)):
    """Upload a receipt and extract merchant/total via OCR"""
    try:
        # Read file bytes
        file_bytes = await file.read()
        print(f"📥 Received file: {file.filename}, size: {len(file_bytes)} bytes")
        
        # Extract using ReceiptExtractor
        extractor = ReceiptExtractor()
        print(f"🔄 Starting OCR extraction...")
        result = await extractor.extract_from_bytes(file_bytes, file.filename or 'receipt')
        print(f"✅ OCR result: {result}")
        
        # Ensure numeric values
        amount = 0.0
        try:
            amount = float(result.get('total')) if result.get('total') else 0.0
        except (TypeError, ValueError):
            amount = 0.0
        
        date_str = result.get('date')
        if not date_str:
            date_str = datetime.utcnow().date().isoformat()
        
        merchant = result.get('merchant') or 'Unknown Store'
        
        # Return extracted data
        response = {
            'id': str(hash(file_bytes))[:8],
            'fileName': file.filename,
            'uploadDate': datetime.utcnow().isoformat(),
            'ocrData': {
                'merchant': merchant,
                'amount': amount,
                'date': date_str,
                'items': [],
                'suggestedCategory': 'Shopping'
            }
        }
        print(f"📤 Returning: {response}")
        return response
    except Exception as e:
        print(f"❌ Upload error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process receipt: {str(e)}")


if __name__ == '__main__':
    uvicorn.run('backend.fastapi.main:app', host='0.0.0.0', port=8000, reload=True)
