# FastAPI Mock Backend

This small FastAPI app serves mock transaction and category data for the frontend during development.

Quick start (requires Python 3.9+):

1. Create a virtual environment and install deps:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
pip install -r backend/fastapi/requirements.txt
```

2. Run the dev server:

```bash
uvicorn backend.fastapi.main:app --reload --host 0.0.0.0 --port 8000
```

The frontend expects the backend to be at `http://localhost:8000` by default. You can change this by setting `NEXT_PUBLIC_API_URL` in your Next.js environment.

Endpoints:
- `GET /transactions`
- `GET /transactions/{id}`
- `POST /transactions`
- `POST /transactions/bulk`
- `GET /categories`
- `GET /budget-summary`
- `GET /budget`
- `PUT /budget`
- `PUT /categories/{id-or-name}`

Assistant + planner endpoints:
- `POST /assistant/chat` (Dedalus-powered router + reasoning)
- `GET /assistant/budget-status`
- `GET /assistant/spending-summary`
- `GET /assistant/category-spend?category=Groceries`
- `GET /assistant/cashflow-projection`
- `POST /assistant/simulate-purchase`
- `GET /assistant/anomalies`
- `GET /assistant/recurring`

Goals endpoints:
- `GET /goals`
- `POST /goals`
- `DELETE /goals/{id}`

### Dedalus configuration

Create `backend/fastapi/.env` (it is gitignored) with:

```bash
DEDALUS_API_KEY=...
# Optional overrides
DEDALUS_API_BASE=https://api.dedaluslabs.ai/v1
DEDALUS_PLANNER_MODEL=anthropic/claude-haiku-4-5-20251001
DEDALUS_REASONER_MODEL=anthropic/claude-sonnet-4-5-20250929
```

## Signed amount convention

This project stores transaction amounts as **signed** numbers:

- **Expenses (spend)**: positive (e.g. `+45.20`)
- **Income/refunds**: negative (e.g. `-12000.00`)

Budget summary and category analytics intentionally include **expenses only**.

## Import a bank statement CSV

The repo includes a sample bank statement at the project root: `comprehensive_bank_statement.csv`.

1) Start the backend:

```bash
uvicorn backend.fastapi.main:app --reload --host 0.0.0.0 --port 8000
```

2) Import the CSV (from the project root):

```bash
python backend/scripts/import_bank_statement.py --csv comprehensive_bank_statement.csv --api http://localhost:8000
```

Optional: see how rows map into the fixed taxonomy without importing:

```bash
python backend/scripts/import_bank_statement.py --csv comprehensive_bank_statement.csv --dry-run
```

Category mapping rules live in `backend/scripts/bank_categories.py`.

The backend persists to `backend/fastapi/data.json` and is intended for local development only.
