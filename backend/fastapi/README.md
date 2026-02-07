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
- `GET /categories`
- `GET /budget-summary`

The backend keeps data in memory and is intended for local development only.
