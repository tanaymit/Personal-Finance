from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

try:
    from .mock_data import mock_transactions, mock_categories, mock_budget_summary
except ImportError:
    from mock_data import mock_transactions, mock_categories, mock_budget_summary

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
    return mock_transactions

@app.get('/transactions/{transaction_id}', response_model=Transaction)
def get_transaction(transaction_id: str):
    for t in mock_transactions:
        if t['id'] == transaction_id:
            return t
    raise HTTPException(status_code=404, detail='Transaction not found')

@app.post('/transactions', response_model=Transaction)
def create_transaction(tx: TransactionIn):
    new_id = str(int(mock_transactions[-1]['id']) + 1 if mock_transactions else 1)
    new = {"id": new_id, **tx.dict()}
    mock_transactions.insert(0, new)
    return new

@app.get('/categories', response_model=List[Category])
def list_categories():
    return mock_categories

@app.get('/budget-summary')
def budget_summary():
    # Compute authoritative budget summary from mock_categories so values stay consistent
    total_budget = 0.0
    total_spent = 0.0
    largest_category = None
    largest_amount = 0.0
    for c in mock_categories:
        # ensure numeric values
        try:
            limit = float(c.get('budgetLimit') or 0)
        except Exception:
            limit = 0.0
        try:
            spent = float(c.get('spent') or 0)
        except Exception:
            spent = 0.0

        total_budget += limit
        total_spent += spent
        if spent > largest_amount:
            largest_amount = spent
            largest_category = c.get('name')

    return {
        'totalBudget': total_budget,
        'totalSpent': total_spent,
        'remainingBudget': total_budget - total_spent,
        'largestCategory': largest_category,
        'largestCategoryAmount': largest_amount,
    }

if __name__ == '__main__':
    uvicorn.run('backend.fastapi.main:app', host='0.0.0.0', port=8000, reload=True)
