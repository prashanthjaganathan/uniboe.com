# Contributing to Uniboe

Thank you for contributing! This guide will help you get started quickly.

## Quick Start

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/uniboe.com.git
cd uniboe.com
```

### 2. Install Pre-commit Hooks

```bash
# Backend
cd backend
pip install pre-commit
pre-commit install

# Frontend
cd frontend
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming:**
- `feature/add-search` - New features
- `bugfix/fix-login` - Bug fixes
- `docs/update-readme` - Documentation

### 4. Make Changes

- Write clean, readable code
- Add tests for new features
- Run pre-commit checks: `pre-commit run --all-files`

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add user search"
```

**Commit format:**
```
<type>: <description>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `style` - Formatting
- `chore` - Maintenance

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then on GitHub:
1. Click "Compare & pull request"
2. Base: `dev` ← Compare: `feature/your-feature-name`
3. Fill in description
4. Wait for CI checks ✅
5. Get approval and merge!

## Branch Strategy

- **`main`** - Production (protected)
- **`dev`** - Development (merge here)
- **`feature/*`** - Your feature branches

## Pre-commit Hooks

Pre-commit hooks run automatically before each commit:

**Backend:**
- Black (formatting)
- Flake8 (linting)
- isort (imports)

**Frontend:**
- ESLint (linting)
- Prettier (formatting)

If hooks fail, they often auto-fix. Just commit again:
```bash
git add .
git commit -m "your message"
```

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pre-commit install
uvicorn api.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Code Standards

### Python
- Use type hints
- Write docstrings
- Max line length: 100
- Follow PEP 8

### TypeScript
- Use TypeScript (not JS)
- Define interfaces
- Use functional components
- Follow React best practices

## Testing

### Backend
```bash
pytest
pytest --cov  # with coverage
```

### Frontend
```bash
npm test
```

## Pull Request Checklist

Before submitting:
- [ ] Code is clean and documented
- [ ] Tests pass locally
- [ ] Pre-commit hooks pass
- [ ] No console.log or debug code
- [ ] README updated (if needed)

## Need Help?

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open an issue with details
- **Security:** Email security@uniboe.com

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn

---

Happy coding! 🎓✨
