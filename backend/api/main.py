"""
Main FastAPI application entry point.

This module initializes the FastAPI application, configures middleware,
and sets up all routes and endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.api.routes import universities
import uvicorn


# Initialize FastAPI application
app = FastAPI(
    title="Uniboe API",
    version="0.1.0",
    description="Backend API for Uniboe - Your All-in-One Student Life Companion",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(universities.router, prefix="/api", tags=["Universities"])


@app.get("/", tags=["Root"])
async def root() -> JSONResponse:
    """
    Root endpoint providing basic API information.

    Returns:
        JSONResponse: API name and version
    """
    return JSONResponse(
        content={
            "message": "Uniboe API",
            "version": "0.1.0",
            "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        }
    )


@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        JSONResponse: Health status of the API

    Example:
        >>> GET /health
        {"status": "healthy", "environment": "development"}
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
        }
    )


@app.on_event("startup")
async def startup_event() -> None:
    """
    Application startup event handler.

    Performs initialization tasks when the application starts.
    """
    print(f"🚀 Uniboe API starting in {settings.ENVIRONMENT} mode...")
    print(f"📚 API Documentation: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """
    Application shutdown event handler.

    Performs cleanup tasks when the application shuts down.
    """
    print("👋 Uniboe API shutting down...")


if __name__ == "__main__":
    # Development server configuration
    # In production, use a production ASGI server like Gunicorn with Uvicorn workers
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )

