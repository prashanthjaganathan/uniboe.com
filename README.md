# Uniboe - Student Life Platform

Your All-in-One Student Life Companion

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Bootstrap
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **AI**: Groq API

## Project Structure
```
uniboe/
├── frontend/          # React frontend
├── backend/           # FastAPI backend
└── .github/          # CI/CD workflows
```

## Setup Instructions
See individual README files in `frontend/` and `backend/` directories.

## devment Workflow
1. Create feature branch from `dev`
2. Make changes and commit
3. Push and create Pull Request
4. Wait for CI checks to pass
5. Get approval from at least 1 reviewer
6. Merge to `dev`

## Deployment
- **Frontend**: Auto-deploys to Vercel on merge to `main`
- **Backend**: Auto-deploys to Railway on merge to `main`

