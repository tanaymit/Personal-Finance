import json
import os
import uuid
import calendar
from datetime import datetime

# 1. Define the Budgets (Missing in your file)
NEW_BUDGETS = {
    "Housing & Rent": 1500.0,
    "Groceries": 800.0,
    "Dining & Coffee": 600.0,
    "Shopping": 500.0,
    "Transportation": 400.0,
    "Entertainment": 300.0,
    "Utilities & Bills": 300.0,
    "Health & Medical": 200.0,
    "Personal Care": 200.0
}

# 2. Define Goals (Missing in your file)
NEW_GOALS = [
    {
        "name": "Europe Trip 2026",
        "target_amount": 5000.0,
        "current_amount": 1850.0,
        "deadline": "2026-06-15"
    },
    {
        "name": "Emergency Fund",
        "target_amount": 10000.0,
        "current_amount": 8500.0,
        "deadline": "2026-12-31"
    }
]

# 3. Define "Future" Transactions (Jan 14 - Jan 31 2026)
# These allow you to ask: "Will I have enough money after rent?"
FUTURE_TRANSACTIONS = [
    {"date": "2026-01-15", "merchant": "Whole Foods", "amount": 145.20, "category": "Groceries", "description": "Weekly Groceries"},
    {"date": "2026-01-17", "merchant": "Home Loan EMI", "amount": 1200.00, "category": "Housing & Rent", "description": "Scheduled Home Loan Payment"},
    {"date": "2026-01-18", "merchant": "Uber", "amount": 28.45, "category": "Transportation", "description": "Ride to downtown"},
    {"date": "2026-01-20", "merchant": "Car Loan EMI", "amount": 350.00, "category": "Debt Payments", "description": "Car Loan Payment"},
    {"date": "2026-01-22", "merchant": "Apple Store", "amount": 1299.00, "category": "Shopping", "description": "New Laptop (Planned Purchase)"},
    {"date": "2026-01-24", "merchant": "Ticketmaster", "amount": 185.50, "category": "Entertainment", "description": "Concert Tickets"},
    {"date": "2026-01-25", "merchant": "Trader Joes", "amount": 85.20, "category": "Groceries", "description": "Groceries"},
    {"date": "2026-01-28", "merchant": "Verizon Wireless", "amount": 120.00, "category": "Utilities & Bills", "description": "Phone Bill"},
    {"date": "2026-01-30", "merchant": "Monthly Salary", "amount": -12000.00, "category": "Income", "description": "Payroll Direct Deposit"}
]

def generate_id(date_str, merchant, amount):
    unique_str = f"{date_str}-{merchant}-{amount}"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_str))

def main():
    # Locate data.json
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "fastapi", "data.json")

    print(f"Reading from: {data_path}")
    
    if not os.path.exists(data_path):
        print(f"❌ Error: {data_path} not found. Please run import_bank_statement.py first.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # A. Inject Budgets & Goals
    data["category_budgets"] = NEW_BUDGETS
    data["goals"] = NEW_GOALS
    data["default_budget"] = 4500.0

    # B. Inject Future Transactions
    existing_ids = {t["id"] for t in data["transactions"]}
    added_count = 0

    for item in FUTURE_TRANSACTIONS:
        tid = generate_id(item["date"], item["merchant"], item["amount"])
        
        # Only add if not already present
        if tid not in existing_ids:
            new_txn = {
                "id": tid,
                "date": item["date"],
                "merchant": item["merchant"],
                "amount": item["amount"],
                "category": item["category"],
                "description": item["description"]
            }
            data["transactions"].append(new_txn)
            existing_ids.add(tid)
            added_count += 1

    # C. Sort by Date
    data["transactions"].sort(key=lambda x: x.get("date", ""))

    # D. Save
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Success! Updated Budgets, Goals, and added {added_count} future transactions.")

if __name__ == "__main__":
    main()
