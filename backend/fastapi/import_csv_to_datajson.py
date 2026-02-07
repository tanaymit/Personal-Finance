"""
One-off importer: convert comprehensive_bank_statement.csv -> data.json
Adjust field names below if your CSV schema changes.
"""
import csv
import json
import uuid
from pathlib import Path
from datetime import datetime

CSV_FILE = Path(__file__).resolve().parents[2] / "comprehensive_bank_statement.csv"
OUTPUT_FILE = Path(__file__).parent / "data.json"

# Map CSV headers to our internal field names
FIELD_MAP = {
    "date": ["Date", "date"],
    "amount": ["Amount", "amount"],
    "description": ["Description", "description"],
    "category": ["Category", "category"],
    "type": ["Type", "type"],
}


def _first_match(row: dict, keys: list[str], default: str = "") -> str:
    for k in keys:
        if k in row and row[k]:
            return row[k]
    return default


def _parse_date(value: str) -> str:
    """Normalize date to YYYY-MM-DD; fall back to raw if parse fails."""
    if not value:
        return ""
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return value  # keep original if unrecognized


def _parse_amount(value: str) -> float:
    if value is None:
        return 0.0
    # Strip currency symbols and commas
    cleaned = str(value).replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def load_transactions() -> list[dict]:
    if not CSV_FILE.exists():
        raise FileNotFoundError(f"CSV not found at {CSV_FILE}")

    transactions: list[dict] = []
    with CSV_FILE.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_raw = _first_match(row, FIELD_MAP["date"])
            amt_raw = _first_match(row, FIELD_MAP["amount"], "0")
            desc = _first_match(row, FIELD_MAP["description"], "")
            cat = _first_match(row, FIELD_MAP["category"], "Uncategorized")
            txn_type = _first_match(row, FIELD_MAP["type"], "").strip()

            amount = _parse_amount(amt_raw)
            # Normalize sign based on transaction type
            t_lower = txn_type.lower()
            if t_lower.startswith("withdraw"):
                amount = -abs(amount)
            elif t_lower.startswith("deposit"):
                amount = abs(amount)

            transactions.append({
                "id": str(uuid.uuid4()),
                "date": _parse_date(date_raw),
                "merchant": desc[:60] or "Unknown",  # merchant is optional; use description snippet
                "amount": amount,
                "category": cat or "Uncategorized",
                "description": desc,
                "type": txn_type,
            })
    return transactions


def main() -> None:
    txns = load_transactions()
    payload = {
        "transactions": txns,
        "category_budgets": {},
        "default_budget": 0.0,
    }
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(txns)} transactions to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
