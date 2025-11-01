# Uniboe Backend

FastAPI + Python + Supabase backend for the Uniboe student platform.

## Quick Start

### 1. Setup Environment

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install pre-commit hooks (important!)
pip install pre-commit
pre-commit install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your Supabase and Groq API credentials
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `GROQ_API_KEY` - Groq AI API key
- `JWT_SECRET_KEY` - Generate with: `openssl rand -hex 32`

### 3. Start Development Server

```bash
uvicorn api.main:app --reload
```

Server runs at: http://localhost:8000

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Development Commands

```bash
# Start dev server
uvicorn api.main:app --reload

# Run tests
pytest

# Format code (auto-fix)
black .

# Check linting
flake8 .

# Run all pre-commit checks
pre-commit run --all-files
```

## Pre-commit Hooks

Pre-commit hooks automatically run before each commit to ensure code quality:

- ✅ **Black** - Code formatting
- ✅ **Flake8** - Linting
- ✅ **isort** - Import sorting
- ✅ **autoflake** - Remove unused imports
- ✅ **autopep8** - PEP8 compliance

If pre-commit hooks fail, they'll auto-fix most issues. Just stage the changes and commit again:

```bash
git add .
git commit -m "your message"
```

## Project Structure

```
backend/
├── api/              # API routes and endpoints
├── core/             # Business logic and models
├── config/           # Configuration settings
├── db/               # Database client and migrations
└── tests/            # Test files
```

## Common Issues

**Issue:** `ModuleNotFoundError`  
**Fix:** Activate virtual environment: `source venv/bin/activate`

**Issue:** Pre-commit hooks not running  
**Fix:** Run `pre-commit install`

**Issue:** Database connection errors  
**Fix:** Check `.env` file has correct Supabase credentials

## Contributing

See [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for guidelines.

