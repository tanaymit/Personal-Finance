from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import asyncio
import traceback
import sys
from datetime import datetime
from pathlib import Path
import uuid
from dotenv import load_dotenv

# Ensure current directory is in path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Load .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

from receipt_extractor import ReceiptExtractor
from ai_agent import chat_with_ai, ChatRequest, ChatResponse
import json


def _parsed_date_safe(dt_str: str):
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(dt_str, fmt)
        except Exception:
            continue
    try:
        return datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.min

# JSON-based persistence
data_file = Path(__file__).parent / 'data.json'

def load_data():
    """Load transactions and settings from JSON file."""
    if data_file.exists():
        try:
            with open(data_file, 'r') as f:
                data = json.load(f)
                return data.get('transactions', []), data.get('category_budgets', {}), data.get('default_budget', 3000.0)
        except Exception as e:
            print(f"⚠️  Failed to load data: {e}")
    return [], {}, 3000.0

def save_data():
    """Save transactions and settings to JSON file."""
    try:
        data = {
            'transactions': transactions,
            'category_budgets': category_budgets,
            'default_budget': default_budget
        }
        with open(data_file, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"❌ Failed to save data: {e}")

# Load data on startup
transactions, category_budgets, default_budget = load_data()
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

@app.get('/transactions', response_model=List[Transaction])
def list_transactions():
    # Return transactions sorted by date desc so newest shows first in UI
    return sorted(transactions, key=lambda t: _parsed_date_safe(t.get('date', '')), reverse=True)

@app.get('/transactions/{transaction_id}', response_model=Transaction)
def get_transaction(transaction_id: str):
    for t in transactions:
        if t['id'] == transaction_id:
            return t
    raise HTTPException(status_code=404, detail='Transaction not found')

@app.post('/transactions', response_model=Transaction)
def create_transaction(tx: TransactionIn):
    # Use UUIDs for transaction IDs to avoid collisions
    new_id = uuid.uuid4().hex
    new = {"id": new_id, **tx.dict()}
    # insert sorted by date descending to keep order consistent
    transactions.append(new)
    transactions.sort(key=lambda t: _parsed_date_safe(t.get('date', '')), reverse=True)
    save_data()
    return new

@app.get('/categories', response_model=List[Category])
def list_categories():
    # Build categories from recorded transactions (current month, outflows only)
    # Determine reference month (latest transaction month if data is historical)
    latest_dt = None
    for t in transactions:
        dt = _parsed_date_safe(t.get('date', ''))
        if dt and (latest_dt is None or dt > latest_dt):
            latest_dt = dt
    now_ref = latest_dt or datetime.utcnow()
    current_year, current_month = now_ref.year, now_ref.month

    monthly_txns = []
    for t in transactions:
        dt = _parsed_date_safe(t.get('date', ''))
        if not dt:
            continue
        if dt.year == current_year and dt.month == current_month:
            monthly_txns.append(t)

    grouped = {}
    for t in monthly_txns:
        cat = t.get('category') or 'Uncategorized'
        grouped.setdefault(cat, 0.0)
        try:
            amt = float(t.get('amount') or 0)
        except Exception:
            amt = 0.0
        # Spend is positive for outflows only
        if amt < 0:
            grouped[cat] += abs(amt)

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
def budget_summary():
    """
    Monthly view: compute spend only for the current calendar month (in data dates).
    totalSpent counts outflows only (negative amounts). Inflows are ignored for spend.
    """
    total_budget = float(default_budget or 0.0)

    # Determine current month/year based on the latest transaction date; fallback to today
    def _parse_date(dt_str: str):
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
            try:
                return datetime.strptime(dt_str, fmt)
            except Exception:
                continue
        try:
            return datetime.fromisoformat(dt_str)
        except Exception:
            return None

    latest_dt = None
    for t in transactions:
        dt = _parse_date(t.get('date', ''))
        if dt and (latest_dt is None or dt > latest_dt):
            latest_dt = dt
    now_ref = latest_dt or datetime.utcnow()

    current_year = now_ref.year
    current_month = now_ref.month

    monthly_txns = []
    for t in transactions:
        dt = _parse_date(t.get('date', ''))
        if not dt:
            continue
        if dt.year == current_year and dt.month == current_month:
            monthly_txns.append(t)

    total_spent = 0.0
    by_cat = {}
    for t in monthly_txns:
        try:
            amt = float(t.get('amount') or 0)
        except Exception:
            amt = 0.0

        spend_component = abs(amt) if amt < 0 else 0.0
        total_spent += spend_component

        cat = t.get('category') or 'Uncategorized'
        by_cat.setdefault(cat, 0.0)
        if amt < 0:
            by_cat[cat] += abs(amt)

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
        'month': now_ref.strftime('%Y-%m'),
        'transactionCount': len(monthly_txns)
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


@app.put('/categories/{name}')
def set_category_budget(name: str, payload: dict):
    # set a budget limit for a category
    try:
        v = payload.get('budgetLimit')
        if v is None:
            raise ValueError('missing')
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


# ==================== AI CHAT ENDPOINT ====================

@app.post('/chat')
async def chat_endpoint(request: ChatRequest):
    """AI chat endpoint – accepts a message, uses tools + LLM reasoning, returns response."""
    try:
        response = await chat_with_ai(
            user_message=request.message,
            conversation_history=request.conversation_history
        )
        return response.dict()
    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


if __name__ == '__main__':
    uvicorn.run('backend.fastapi.main:app', host='0.0.0.0', port=8000, reload=True)
