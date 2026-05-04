"""
FastAPI application factory with lifespan management.

Initializes:
- Database connection and migrations
- Role seeding
- Admin user seeding
- ML model loading
- Middleware setup
- Error handlers
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.core.exceptions import general_exception_handler, http_exception_handler
from app.database import Base, async_session_maker, dispose_db, engine, init_db
from app.ml import ModelRegistry
from app.models import Role, User
from app.routers import auth_router, inference_router, users_router
from app.services import UserService
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for app startup and shutdown.

    Startup:
    - Initialize database and run migrations
    - Seed roles (admin, user)
    - Seed admin user from environment variables
    - Load ML models and label maps

    Shutdown:
    - Dispose database engine

    Args:
        app: FastAPI application instance.

    Yields:
        Control to FastAPI during app lifetime.
    """
    logger.info("=" * 60)
    logger.info("ASL Recognition PWA Backend - Starting Up")
    logger.info("=" * 60)

    try:
        # Initialize database
        logger.info("Initializing database...")
        await init_db()
        logger.info("✓ Database initialized")

        # Seed roles
        logger.info("Seeding roles...")
        async with async_session_maker() as session:
            # Check if roles exist
            result = await session.execute(select(Role).where(Role.name == "admin"))
            admin_role = result.scalar_one_or_none()

            if not admin_role:
                admin_role = Role(
                    name="admin",
                    description="Administrator with full access",
                )
                session.add(admin_role)

            result = await session.execute(select(Role).where(Role.name == "user"))
            user_role = result.scalar_one_or_none()

            if not user_role:
                user_role = Role(
                    name="user",
                    description="Regular user with limited access",
                )
                session.add(user_role)

            await session.flush()
            logger.info(f"✓ Roles seeded: admin (id={admin_role.id}), user (id={user_role.id})")

            # Seed admin user
            logger.info("Seeding admin user...")
            admin_email = settings.admin_email
            admin_password = settings.admin_password

            result = await session.execute(select(User).where(User.email == admin_email))
            existing_admin = result.scalar_one_or_none()

            if not existing_admin:
                admin_user = await UserService.create_user(
                    session=session,
                    email=admin_email,
                    password=admin_password,
                    full_name="Administrator",
                    role_id=admin_role.id,
                )
                logger.info(f"✓ Admin user created: {admin_email}")
            else:
                logger.info(f"✓ Admin user already exists: {admin_email}")

            await session.commit()

        # Load ML models
        logger.info("Loading ML models...")
        try:
            ModelRegistry.initialize()
            logger.info("✓ ML models loaded successfully")
        except Exception as e:
            logger.warning(f"⚠ Warning during ML model initialization: {e}")
            logger.warning("Application continuing without models - API will be available")

        logger.info("=" * 60)
        logger.info("✓ Application startup complete")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"✗ Startup failed: {e}", exc_info=True)
        raise

    yield  # Control to FastAPI

    # Shutdown
    logger.info("=" * 60)
    logger.info("ASL Recognition PWA Backend - Shutting Down")
    logger.info("=" * 60)

    logger.info("Cleaning up database connections...")
    await dispose_db()
    logger.info("✓ Database connections disposed")

    logger.info("=" * 60)
    logger.info("✓ Application shutdown complete")
    logger.info("=" * 60)


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        Configured FastAPI application instance.
    """
    app = FastAPI(
        title="ASL Recognition PWA Backend",
        description="Production-grade backend for ASL (American Sign Language) recognition",
        version="1.0.0",
        docs_url="/docs" if settings.app_env == "development" else None,
        redoc_url="/redoc" if settings.app_env == "development" else None,
        openapi_url="/openapi.json" if settings.app_env == "development" else None,
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(inference_router)

    # Add exception handlers
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return await general_exception_handler(request, exc)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation failed: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors(), "body": getattr(exc, "body", None)},
        )
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check() -> dict:
        """Health check endpoint.

        Returns:
            dict with status.
        """
        return {"status": "ok", "version": "1.0.0"}

    logger.info("FastAPI application created successfully")

    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=settings.log_level.lower(),
    )
