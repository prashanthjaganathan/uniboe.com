# Contributing to Uniboe

## Git Workflow

### Branch Strategy
- `main` - Production branch (auto-deploys)
- `dev` - devment branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes

### Making Changes

1. **Pull latest dev:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add user profile page"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request:**
   - Go to GitHub
   - Click "Compare & pull request"
   - Base: `dev` ← Compare: `feature/your-feature-name`
   - Fill in description
   - Request review from at least 1 team member
   - Wait for CI checks to pass
   - Get approval and merge

### Commit Message Format
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
```

### Code Review Checklist
- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] No console.log or debug code
- [ ] Environment variables are in .env.example
- [ ] README updated if needed

