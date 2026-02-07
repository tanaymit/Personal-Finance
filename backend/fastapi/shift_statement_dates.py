from __future__ import annotations

import argparse
import csv
from datetime import date, datetime, timedelta
from pathlib import Path


def parse_mmddyyyy(s: str) -> date:
    return datetime.strptime(s.strip(), "%m/%d/%Y").date()


def fmt_mmddyyyy(d: date) -> str:
    return d.strftime("%m/%d/%Y")


def shift_csv_dates(csv_path: Path, days: int) -> tuple[int, date, date, date, date]:
    rows: list[dict] = []

    with csv_path.open("r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames or "Date" not in fieldnames:
            raise ValueError("CSV missing Date header")
        for r in reader:
            rows.append(r)

    before_dates = [parse_mmddyyyy(r["Date"]) for r in rows if (r.get("Date") or "").strip()]
    before_min = min(before_dates)
    before_max = max(before_dates)

    delta = timedelta(days=int(days))

    for r in rows:
        ds = (r.get("Date") or "").strip()
        if not ds:
            continue
        d0 = parse_mmddyyyy(ds)
        r["Date"] = fmt_mmddyyyy(d0 + delta)

    after_dates = [parse_mmddyyyy(r["Date"]) for r in rows if (r.get("Date") or "").strip()]
    after_min = min(after_dates)
    after_max = max(after_dates)

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return len(rows), before_min, before_max, after_min, after_max


def main() -> None:
    parser = argparse.ArgumentParser(description="Shift all Date values in a bank statement CSV")
    parser.add_argument("--csv", type=str, required=True)
    parser.add_argument("--days", type=int, required=True, help="Days to shift (negative moves earlier)")
    args = parser.parse_args()

    csv_path = Path(args.csv).expanduser().resolve()
    n, bmin, bmax, amin, amax = shift_csv_dates(csv_path, args.days)
    print(f"Updated {n} rows")
    print(f"  Before: {bmin.isoformat()} .. {bmax.isoformat()}")
    print(f"  After : {amin.isoformat()} .. {amax.isoformat()}")


if __name__ == "__main__":
    main()
