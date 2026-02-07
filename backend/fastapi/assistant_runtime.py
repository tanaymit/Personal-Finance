from __future__ import annotations

import calendar
import json
import os
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx


# -----------------
# Period utilities
# -----------------

def resolve_period_for_transactions(
    transactions: List[Dict[str, Any]],
    year: Optional[int],
    month: Optional[int],
) -> Tuple[int, int]:
    if year is not None and month is not None:
        return year, month

    # Prefer "current" period based on data (latest transaction), so demos
    # can behave like it's mid-month even if the system date differs.
    latest: Optional[date] = None
    for t in transactions:
        try:
            dt = parse_date(str(t.get("date", "")))
        except Exception:
            continue
        if latest is None or dt > latest:
            latest = dt

    base = latest or date.today()
    y = year if year is not None else base.year
    m = month if month is not None else base.month
    return y, m


def parse_date(value: str) -> date:
    v = (value or "").strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date: {value}")


def filter_transactions_period(
    transactions: List[Dict[str, Any]],
    year: Optional[int],
    month: Optional[int],
) -> List[Dict[str, Any]]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    out: List[Dict[str, Any]] = []
    for t in transactions:
        try:
            dt = parse_date(str(t.get("date", "")))
        except Exception:
            continue
        if dt.year != y or dt.month != m:
            continue
        out.append(t)
    return out


def amount(t: Dict[str, Any]) -> float:
    try:
        return float(t.get("amount") or 0)
    except Exception:
        return 0.0


def is_expense(t: Dict[str, Any]) -> bool:
    # Convention: expenses positive, income/refunds negative
    return amount(t) > 0


# -----------------
# Tool: summaries
# -----------------

def get_spending_summary(
    transactions: List[Dict[str, Any]],
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    period_tx = filter_transactions_period(transactions, y, m)

    expenses = [t for t in period_tx if is_expense(t)]
    total_spent = round(sum(amount(t) for t in expenses), 2)

    by_cat: Dict[str, float] = {}
    for t in expenses:
        cat = (t.get("category") or "Other").strip() or "Other"
        by_cat[cat] = by_cat.get(cat, 0.0) + amount(t)

    top_categories = [
        {"category": c, "spent": round(v, 2)}
        for c, v in sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True)[:3]
    ]

    outlier = None
    if expenses:
        biggest = max(expenses, key=lambda t: amount(t))
        outlier = {
            "id": biggest.get("id"),
            "date": biggest.get("date"),
            "merchant": biggest.get("merchant") or "",
            "description": biggest.get("description") or "",
            "category": biggest.get("category") or "Other",
            "amount": round(amount(biggest), 2),
        }

    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "totalSpent": total_spent,
        "topCategories": top_categories,
        "outlier": outlier,
    }


def get_budget_status(
    transactions: List[Dict[str, Any]],
    default_budget: float,
    category_budgets: Dict[str, float],
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    spending = get_spending_summary(transactions, y, m)
    spent = float(spending["totalSpent"])
    budget = float(default_budget or 0.0)

    last_day = calendar.monthrange(y, m)[1]
    days_in_month = last_day

    # If we're not in the system's current month, compute "as-of" as the last
    # transaction date in that period to preserve mid-month behavior.
    system_today = date.today()
    if system_today.year == y and system_today.month == m:
        as_of = system_today
    else:
        period_dates: List[date] = []
        for t in filter_transactions_period(transactions, y, m):
            try:
                period_dates.append(parse_date(str(t.get("date", ""))))
            except Exception:
                continue
        as_of = max(period_dates) if period_dates else date(y, m, 1)

    days_remaining = max(0, (date(y, m, last_day) - as_of).days)

    percent_used = (spent / budget * 100.0) if budget > 0 else None

    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "budget": round(budget, 2),
        "spent": round(spent, 2),
        "remaining": round(budget - spent, 2),
        "percentUsed": round(percent_used, 2) if percent_used is not None else None,
        "daysRemaining": int(days_remaining),
        "avgDailySpendThisMonth": round(spent / max(1, days_in_month), 2),
        "categoryBudgets": category_budgets,
        "topCategories": spending["topCategories"],
        "outlier": spending["outlier"],
    }


def get_category_spend(
    transactions: List[Dict[str, Any]],
    category: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    period_tx = filter_transactions_period(transactions, y, m)

    cat = (category or "").strip().lower()
    matches = [t for t in period_tx if is_expense(t) and str(t.get("category", "")).strip().lower() == cat]

    spent = round(sum(amount(t) for t in matches), 2)
    txn_count = len(matches)

    by_merchant: Dict[str, float] = {}
    for t in matches:
        merch = (t.get("merchant") or "Unknown").strip() or "Unknown"
        by_merchant[merch] = by_merchant.get(merch, 0.0) + amount(t)

    top_merchants = [
        {"merchant": k, "spent": round(v, 2)}
        for k, v in sorted(by_merchant.items(), key=lambda kv: kv[1], reverse=True)[:5]
    ]

    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "category": category,
        "spent": spent,
        "transactionCount": txn_count,
        "topMerchants": top_merchants,
    }


def get_transaction_detail(transactions: List[Dict[str, Any]], transaction_id: str) -> Dict[str, Any]:
    for t in transactions:
        if str(t.get("id")) == str(transaction_id):
            return {"transaction": t}
    return {"error": "Transaction not found"}


def get_cashflow_projection(
    transactions: List[Dict[str, Any]],
    year: Optional[int] = None,
    month: Optional[int] = None,
    starting_balance: float = 0.0,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    period_tx = filter_transactions_period(transactions, y, m)

    rows: List[Tuple[date, float]] = []
    for t in period_tx:
        try:
            dt = parse_date(str(t.get("date", "")))
        except Exception:
            continue
        rows.append((dt, amount(t)))

    rows.sort(key=lambda x: x[0])

    bal = float(starting_balance)
    low_bal = bal
    low_date: Optional[str] = None

    for dt, amt in rows:
        # expenses positive => decrease balance; income negative => increase balance
        bal += (-amt)
        if bal < low_bal:
            low_bal = bal
            low_date = dt.isoformat()

    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "startingBalance": round(float(starting_balance), 2),
        "lowestBalance": round(float(low_bal), 2),
        "lowestBalanceDate": low_date,
        "endingBalance": round(float(bal), 2),
        "note": "Projection is based only on imported transactions; it is not linked to your real bank balance.",
    }


def simulate_purchase(
    transactions: List[Dict[str, Any]],
    default_budget: float,
    category_budgets: Dict[str, float],
    amount_value: float,
    category: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    starting_balance: float = 0.0,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    status_before = get_budget_status(transactions, default_budget, category_budgets, y, m)
    cash_before = get_cashflow_projection(transactions, y, m, starting_balance=starting_balance)

    added = {
        "date": date.today().isoformat(),
        "merchant": "Simulated Purchase",
        "amount": abs(float(amount_value)),
        "category": category,
        "description": "Simulated purchase for affordability check",
    }

    temp = [added, *transactions]
    status_after = get_budget_status(temp, default_budget, category_budgets, y, m)
    cash_after = get_cashflow_projection(temp, y, m, starting_balance=starting_balance)

    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "purchase": {"amount": round(abs(float(amount_value)), 2), "category": category},
        "budget": {
            "before": status_before,
            "after": status_after,
        },
        "cashflow": {
            "before": cash_before,
            "after": cash_after,
        },
    }


def detect_anomalies(
    transactions: List[Dict[str, Any]],
    year: Optional[int] = None,
    month: Optional[int] = None,
    limit: int = 3,
) -> Dict[str, Any]:
    y, m = resolve_period_for_transactions(transactions, year, month)
    period_tx = [t for t in filter_transactions_period(transactions, y, m) if is_expense(t)]

    # Simple, hackathon-friendly anomaly: top-N largest expenses
    top = sorted(period_tx, key=lambda t: amount(t), reverse=True)[: max(1, int(limit))]
    return {
        "period": {"year": y, "month": m},
        "currency": "USD",
        "anomalies": [
            {
                "id": t.get("id"),
                "date": t.get("date"),
                "merchant": t.get("merchant"),
                "category": t.get("category"),
                "amount": round(amount(t), 2),
                "description": t.get("description"),
            }
            for t in top
        ],
        "method": "largest_expenses",
    }


def get_recurring_transactions(
    transactions: List[Dict[str, Any]],
    months_back: int = 4,
) -> Dict[str, Any]:
    # Identify merchants that appear in >=3 distinct months with similar amounts
    today = date.today()
    window_start = date(today.year, max(1, today.month - months_back + 1), 1)

    by_merchant: Dict[str, List[Dict[str, Any]]] = {}
    for t in transactions:
        try:
            dt = parse_date(str(t.get("date", "")))
        except Exception:
            continue
        if dt < window_start:
            continue
        if not is_expense(t):
            continue
        merch = (t.get("merchant") or "Unknown").strip() or "Unknown"
        by_merchant.setdefault(merch, []).append(t)

    recurring = []
    for merch, txs in by_merchant.items():
        months = {(parse_date(str(t.get("date"))).year, parse_date(str(t.get("date"))).month) for t in txs}
        if len(months) < 3:
            continue
        amts = sorted([amount(t) for t in txs])
        median = amts[len(amts) // 2]
        # Similar if within 15% of median
        similar = [t for t in txs if abs(amount(t) - median) <= max(1.0, 0.15 * median)]
        if len(similar) < 3:
            continue
        recurring.append({
            "merchant": merch,
            "estimatedMonthly": round(median, 2),
            "occurrences": len(similar),
            "category": (similar[0].get("category") if similar else None),
        })

    recurring = sorted(recurring, key=lambda r: r["estimatedMonthly"], reverse=True)[:10]
    return {
        "currency": "USD",
        "recurring": recurring,
        "note": "Recurring detection is heuristic (hackathon-friendly).",
    }


# -----------------
# Dedalus chat + routing
# -----------------

DEDALUS_API_KEY = os.getenv("DEDALUS_API_KEY", "").strip().strip('"')
DEDALUS_API_BASE = os.getenv("DEDALUS_API_BASE", "https://api.dedaluslabs.ai/v1").rstrip("/")
DEDALUS_PLANNER_MODEL = os.getenv(
    "DEDALUS_PLANNER_MODEL",
    "anthropic/claude-haiku-4-5-20251001",
)
DEDALUS_REASONER_MODEL = os.getenv(
    "DEDALUS_REASONER_MODEL",
    "anthropic/claude-sonnet-4-5-20250929",
)


async def dedalus_chat(messages: List[Dict[str, str]], model: str, temperature: float = 0.2) -> str:
    if not DEDALUS_API_KEY:
        raise RuntimeError("Missing DEDALUS_API_KEY")

    url = f"{DEDALUS_API_BASE}/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    headers = {
        "Authorization": f"Bearer {DEDALUS_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()

    return data["choices"][0]["message"]["content"]


def _extract_json_object(text: str) -> Optional[dict]:
    try:
        return json.loads(text)
    except Exception:
        pass

    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def tier0_response(user_text: str) -> Optional[str]:
    t = (user_text or "").strip().lower()
    if not t:
        return "Ask me something like: 'How much did I spend on groceries this month?'"

    if re.fullmatch(r"(hi|hello|hey|yo|sup)(\s+there)?[!. ]*", t):
        return (
            "Hi — I can help you analyze your spending, budget, and affordability. "
            "Try: 'budget status', 'groceries this month', or 'can I afford a $200 dinner?'"
        )

    if "help" in t or "what can you do" in t:
        return (
            "I can answer questions like:\n"
            "- How much did I spend on groceries this month?\n"
            "- What are my top categories?\n"
            "- Am I on track with my budget?\n"
            "- Can I afford a purchase (simulation)?\n"
            "- Show unusual/large transactions"
        )

    return None


async def plan_tool_calls(user_text: str) -> dict:
    system = (
        "You are a routing planner for a personal finance chatbot. "
        "Return JSON only.\n"
        "Choose tool calls to answer the user's question.\n"
        "Default to current month/year if not specified.\n"
        "Tools available:\n"
        "- get_spending_summary(year?, month?)\n"
        "- get_budget_status(year?, month?)\n"
        "- get_cashflow_projection(year?, month?, startingBalance?)\n"
        "- get_category_spend(category, year?, month?)\n"
        "- get_transaction_detail(id)\n"
        "- simulate_purchase(amount, category, year?, month?, startingBalance?)\n"
        "- detect_anomalies(year?, month?, limit?)\n"
        "- get_recurring_transactions()\n"
        "- get_user_goals()\n"
        "Output schema:\n"
        "{\n"
        "  \"tier\": 1 or 2,\n"
        "  \"calls\": [{\"tool\": string, \"args\": object}],\n"
        "  \"answerStyle\": \"short\" or \"detailed\"\n"
        "}\n"
        "Tier 1 = single call. Tier 2 = multiple calls (2-4).\n"
    )

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_text},
    ]

    raw = await dedalus_chat(messages, model=DEDALUS_PLANNER_MODEL, temperature=0.0)
    obj = _extract_json_object(raw) or {"tier": 1, "calls": [], "answerStyle": "short"}

    if not isinstance(obj.get("calls"), list):
        obj["calls"] = []

    # hard clamp
    obj["calls"] = obj["calls"][:4]
    if not obj["calls"]:
        obj["tier"] = 1
        obj["calls"] = [{"tool": "get_budget_status", "args": {}}]

    if obj.get("answerStyle") not in ("short", "detailed"):
        obj["answerStyle"] = "short"

    return obj


async def answer_with_facts(user_text: str, facts: Dict[str, Any], style: str = "short") -> str:
    system = (
        "You are a personal finance assistant. "
        "Never invent numbers; use FACTS_JSON only. "
        "If the user asks for something not available, say what data is missing. "
        "Be actionable and concise." if style == "short" else
        "You are a personal finance assistant. Never invent numbers; use FACTS_JSON only. Provide a clear explanation and actionable next steps."
    )

    messages = [
        {"role": "system", "content": system},
        {"role": "system", "content": "FACTS_JSON:\n" + json.dumps(facts, indent=2)},
        {"role": "user", "content": user_text},
    ]

    return await dedalus_chat(messages, model=DEDALUS_REASONER_MODEL, temperature=0.2)
