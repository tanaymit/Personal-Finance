from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path

from import_bank_statement import build_transactions_from_csv


def _load_existing_settings(path: Path) -> tuple[dict, float, list]:
    if not path.exists():
        return {}, 3000.0, []

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        category_budgets = data.get("category_budgets", {}) or {}
        default_budget = float(data.get("default_budget", 3000.0) or 3000.0)
        goals = data.get("goals", []) or []
        return category_budgets, default_budget, goals
    except Exception:
        return {}, 3000.0, []


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rebuild backend/fastapi/data.json from a bank statement CSV (fresh transactions)."
    )
    parser.add_argument(
        "--csv",
        type=str,
        default=str(Path(__file__).parents[2] / "comprehensive_bank_statement.csv"),
        help="Path to the CSV file",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=str(Path(__file__).parent / "data.json"),
        help="Path to write the JSON datastore",
    )
    parser.add_argument(
        "--preserve-settings",
        action="store_true",
        help="Preserve default_budget/category_budgets/goals from the existing JSON (recommended)",
    )

    args = parser.parse_args()
    csv_path = Path(args.csv).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()

    category_budgets: dict = {}
    default_budget: float = 3000.0
    goals: list = []

    if args.preserve_settings:
        category_budgets, default_budget, goals = _load_existing_settings(out_path)

    txs = build_transactions_from_csv(csv_path)

    # Assign new IDs; this is a fresh datastore.
    txs_with_ids = [{"id": uuid.uuid4().hex, **t} for t in txs]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "transactions": txs_with_ids,
        "category_budgets": category_budgets,
        "default_budget": default_budget,
        "goals": goals,
    }
    out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"Wrote {len(txs_with_ids)} transactions to {out_path}")
    print(f"Preserved settings: {bool(args.preserve_settings)}")


if __name__ == "__main__":
    main()
