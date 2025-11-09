# Uniboe Frontend

Your All-in-One Student Life Companion - Frontend Application

## Overview

This is the frontend application for Uniboe, built with React, TypeScript, and Vite. It connects to the Uniboe backend API to provide features for students including social feed, housing marketplace, profile management, and Olive AI assistant.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Features

- **Social Feed**: Share posts and connect with fellow students
- **Housing Marketplace**: Find and list student housing
- **Profile Management**: Create and manage your student profile
- **Olive AI Assistant**: Get help with research, taxes, legal info, and more
- **Authentication**: Secure login/register with university email verification

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see `backend/README.md`)

## Installation

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Environment Setup**

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Uniboe
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── layout/         # Navbar, Footer
│   │   └── shared/         # PostCard, ListingCard, etc.
│   ├── pages/              # Page components
│   │   ├── Landing.tsx
│   │   ├── auth/           # Authentication pages
│   │   ├── feed/           # Social feed pages
│   │   ├── housing/        # Housing marketplace pages
│   │   ├── profile/        # Profile pages
│   │   └── olive/          # Olive AI pages
│   ├── services/           # API service layer
│   │   ├── api.ts          # Axios instance
│   │   ├── auth.service.ts
│   │   ├── feed.service.ts
│   │   ├── housing.service.ts
│   │   ├── profile.service.ts
│   │   └── olive.service.ts
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── types/              # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── feed.types.ts
│   │   ├── housing.types.ts
│   │   ├── profile.types.ts
│   │   └── olive.types.ts
│   ├── lib/                # Utilities
│   │   └── utils.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env.local              # Environment variables
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── package.json
```

## Building for Production

Build the production bundle:

```bash
npm run build
```

The build output will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `VITE_API_BASE_URL` - Your backend API URL
4. Deploy!

The `vercel.json` configuration is already set up for SPA routing.

### Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist/` folder to your hosting provider
3. Configure your server for SPA routing (all routes should serve `index.html`)

## API Integration

The frontend communicates with the backend through RESTful APIs. All API calls are made through service files in `src/services/`.

**Base URL**: Configured via `VITE_API_BASE_URL` environment variable

**Authentication**: JWT tokens stored in localStorage and automatically attached to requests via Axios interceptors.

### Available Endpoints

- **Auth**: `/api/auth/*` - Login, register, logout
- **Feed**: `/api/feed/*` - Posts, likes, comments
- **Housing**: `/api/housing/*` - Listings, search, likes
- **Profile**: `/api/profile/*` - User profiles, stats
- **Olive**: `/api/olive/*` - AI chat conversations

## Key Components

### Authentication Flow

1. User registers with university email
2. Email verification (if required by backend)
3. Login with credentials
4. JWT token stored in localStorage
5. Protected routes require authentication

### State Management

- **AuthContext**: Global auth state (user, token, login/logout methods)
- **Local State**: Component-level state for UI interactions
- **Service Layer**: API calls abstracted into service modules

## Styling

The app uses Tailwind CSS with custom design tokens:

- **Primary Color**: Blue (#667eea)
- **Secondary Color**: Purple/Pink gradient
- **Component Library**: shadcn/ui for consistent UI components
- **Responsive**: Mobile-first design with breakpoints (sm, md, lg, xl)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

### CORS Errors

Ensure the backend `ALLOWED_ORIGINS` includes your frontend URL (http://localhost:3000 for development).

### API Connection Issues

Check that:

1. Backend is running on the correct port
2. `VITE_API_BASE_URL` is set correctly
3. No firewall blocking the connection

### Build Errors

Try:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

This project is part of the Uniboe platform - Built for students, by students.

## Support

For issues or questions, contact: contact@uniboe.com
