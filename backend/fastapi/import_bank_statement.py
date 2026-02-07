from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path
from typing import Iterable

import httpx

from bank_categories import FIXED_CATEGORIES, map_to_fixed_category


def _parse_date_mmddyyyy(value: str) -> str:
    return datetime.strptime(value.strip(), "%m/%d/%Y").date().isoformat()


def _parse_amount_usd(value: str) -> float:
    v = value.strip().replace("$", "").replace(",", "")
    return float(v)


def _extract_merchant(description: str) -> str:
    d = (description or "").strip()

    # Common prefixes in this dataset
    for prefix in (
        "Debit Card Purchase ",
        "Payroll Direct Deposit - ",
        "ATM Withdrawal",
    ):
        if d.lower().startswith(prefix.lower()):
            d = d[len(prefix) :].strip()
            break

    # Take the first segment before a dash if it looks like "X - Monthly Payment"
    if " - " in d:
        head = d.split(" - ", 1)[0].strip()
        if head:
            return head

    return d or "Unknown"


def _chunked(items: list[dict], size: int) -> Iterable[list[dict]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def build_transactions_from_csv(csv_path: Path) -> list[dict]:
    rows: list[dict] = []

    with csv_path.open("r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        required = {"Date", "Type", "Category", "Description", "Amount"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV missing columns: {sorted(missing)}")

        for row in reader:
            date_iso = _parse_date_mmddyyyy(row["Date"])
            tx_type = (row["Type"] or "").strip()
            csv_category = (row["Category"] or "").strip()
            description = (row["Description"] or "").strip()

            amount = _parse_amount_usd(row["Amount"])
            if tx_type.lower() == "deposit":
                # Convention in this app: income/refunds are negative
                amount = -abs(amount)
            else:
                amount = abs(amount)

            category = map_to_fixed_category(
                csv_type=tx_type,
                csv_category=csv_category,
                description=description,
            )
            if category not in FIXED_CATEGORIES:
                category = "Other"

            merchant = _extract_merchant(description)

            rows.append(
                {
                    "date": date_iso,
                    "merchant": merchant,
                    "amount": amount,
                    "category": category,
                    "description": description,
                }
            )

    return rows


async def import_to_backend(api_url: str, transactions: list[dict], batch_size: int = 200) -> None:
    async with httpx.AsyncClient(timeout=60.0) as client:
        for batch in _chunked(transactions, batch_size):
            r = await client.post(f"{api_url.rstrip('/')}/transactions/bulk", json=batch)
            r.raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import comprehensive_bank_statement.csv into the FastAPI backend")
    parser.add_argument("--csv", type=str, default=str(Path(__file__).parents[2] / "comprehensive_bank_statement.csv"))
    parser.add_argument("--api", type=str, default="http://localhost:8000")
    parser.add_argument("--batch", type=int, default=200)
    parser.add_argument("--dry-run", action="store_true")

    args = parser.parse_args()
    csv_path = Path(args.csv).expanduser().resolve()

    txs = build_transactions_from_csv(csv_path)
    print(f"Parsed {len(txs)} rows from {csv_path}")

    if args.dry_run:
        from collections import Counter

        counts = Counter(t["category"] for t in txs)
        print("Category counts:")
        for k, v in counts.most_common():
            print(f"  {k}: {v}")
        return

    import asyncio

    asyncio.run(import_to_backend(args.api, txs, batch_size=args.batch))
    print(f"Imported {len(txs)} transactions into {args.api}")


if __name__ == "__main__":
    main()
