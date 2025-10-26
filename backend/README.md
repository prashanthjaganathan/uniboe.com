# Uniboe Backend

FastAPI + Python + Supabase

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn api.main:app --reload
```

## Available Commands
- `uvicorn api.main:app --reload` - Start dev server
- `pytest` - Run tests
- `black .` - Format code
- `flake8` - Lint code

## API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

