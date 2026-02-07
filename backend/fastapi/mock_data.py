from typing import List, Dict
from datetime import datetime, timedelta

from typing import List, Dict
from datetime import datetime, timedelta

mock_categories = [
    {"id": "1", "name": "Groceries", "icon": "ShoppingCart", "color": "#10B981", "budgetLimit": 600, "spent": 450},
    {"id": "2", "name": "Rent", "icon": "Home", "color": "#3B82F6", "budgetLimit": 2000, "spent": 2000},
    {"id": "3", "name": "Utilities", "icon": "Zap", "color": "#F59E0B", "budgetLimit": 200, "spent": 145},
    {"id": "4", "name": "Transportation", "icon": "Car", "color": "#8B5CF6", "budgetLimit": 300, "spent": 250},
    {"id": "5", "name": "Entertainment", "icon": "Film", "color": "#EC4899", "budgetLimit": 250, "spent": 180},
    {"id": "6", "name": "Dining", "icon": "UtensilsCrossed", "color": "#EF4444", "budgetLimit": 400, "spent": 520},
    {"id": "7", "name": "Shopping", "icon": "ShoppingBag", "color": "#06B6D4", "budgetLimit": 300, "spent": 200},
    {"id": "8", "name": "Healthcare", "icon": "Heart", "color": "#14B8A6", "budgetLimit": 150, "spent": 85},
    {"id": "9", "name": "Subscriptions", "icon": "CreditCard", "color": "#6366F1", "budgetLimit": 100, "spent": 95},
    {"id": "10", "name": "Other", "icon": "MoreHorizontal", "color": "#6B7280", "budgetLimit": 200, "spent": 120},
]

# Generate a few mock transactions
now = datetime.utcnow()
mock_transactions = []
for i in range(1, 21):
    t = {
        "id": str(i),
        "date": (now - timedelta(days=i)).date().isoformat(),
        "merchant": f"Merchant {i}",
        "amount": round(10 + i * 3.5, 2),
        "category": mock_categories[i % len(mock_categories)]["name"],
        "description": f"Mock transaction {i}",
    }
    mock_transactions.append(t)

mock_budget_summary = {
    "totalBudget": 3000,
    "totalSpent": 1245.67,
    "remainingBudget": 1754.33,
}
