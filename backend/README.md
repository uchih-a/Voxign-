# ASL Recognition PWA Backend

Production-grade Python backend for American Sign Language (ASL) recognition Progressive Web App.

## Overview

This backend system:
- Serves two pre-trained Keras models for ASL inference (letter and word recognition)
- Accepts hand landmark data from the frontend (extracted by MediaPipe) and returns predictions
- Manages users with strict role-based access control (RBAC)
- Logs every prediction session for auditing and analytics
- Exposes a fully documented REST API consumed by a React PWA frontend

## Tech Stack

- **Framework:** FastAPI (async)
- **Language:** Python 3.11+
- **Database:** PostgreSQL (asyncpg driver)
- **ORM:** SQLAlchemy 2.x (async mode)
- **Auth:** JWT (python-jose) + bcrypt
- **ML:** TensorFlow 2.x / Keras 3.x
- **Containerization:** Docker + Docker Compose

## Project Structure

```
backend/
├── app/
│   ├── core/              # Security, dependencies, exceptions
│   ├── models/            # SQLAlchemy ORM definitions
│   ├── schemas/           # Pydantic request/response schemas
│   ├── routers/           # API endpoints
│   ├── services/          # Business logic
│   ├── ml/                # Model management and inference
│   ├── main.py            # FastAPI app factory with lifespan
│   ├── config.py          # Configuration (pydantic-settings)
│   └── database.py        # SQLAlchemy engine and session
├── ml_models/             # Pre-trained model files (not in git)
├── tests/                 # Pytest test suite
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
└── .env.example
```

## Quick Start

### Prerequisites

- Docker and Docker Compose (easiest)
- OR: Python 3.11+, PostgreSQL 15, Keras models

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone and setup
git clone <repo>
cd backend
cp .env.example .env

# 2. Create ml_models directory and add model files
mkdir -p ml_models
# Place these files in ml_models/:
# - asl_model_full.keras
# - word_model.keras
# - label_map.json
# - word_label_map.json

# 3. Start services
docker-compose up -d

# 4. Check API
curl http://localhost:8000/health
curl http://localhost:8000/docs  # Swagger UI
```

### Option 2: Local Development

```bash
# 1. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup PostgreSQL
# Create database and user (see .env.example for credentials)
createdb asl_db
createuser asl_user -P  # Set password

# 4. Setup ML models
mkdir -p ml_models
# Place trained model files in ml_models/

# 5. Copy and configure .env
cp .env.example .env
# Edit .env with your database credentials and SECRET_KEY

# 6. Run database migrations
alembic upgrade head

# 7. Start server
uvicorn app.main:app --reload

# 8. Access API
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/health (health check)
```

## API Documentation

### Authentication Flow

1. **Register**: `POST /auth/register`
   - Create new user account
   - Returns user profile (no password)

2. **Login**: `POST /auth/login`
   - Email + password credentials
   - Returns access token + refresh token

3. **Refresh**: `POST /auth/refresh`
   - Use refresh token to get new access token
   - Tokens rotate for security

4. **Logout**: `POST /auth/logout`
   - Clear refresh token from database

### ML Inference

**Letter Recognition**: `POST /inference/letter`
```json
{
  "landmarks": [
    [x, y, z],  // 21 landmark points
    [x, y, z],  // each with normalized coords [0.0-1.0]
    ...
  ]
}
```

Response:
```json
{
  "prediction": "A",
  "confidence": 0.9823,
  "scores": {"A": 0.9823, "B": 0.0041, ...},
  "session_id": "uuid"
}
```

**Word Recognition**: `POST /inference/word`
```json
{
  "sequence": [
    [[x,y,z], ...],  // 30 frames
    [[x,y,z], ...],  // each with 21 landmarks
    ...
  ]
}
```

### User Management (Admin)

- `GET /users/` - List all users (paginated)
- `GET /users/{user_id}` - Get specific user
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Soft-delete user
- `PUT /users/{user_id}/role` - Change user role

### Prediction History

- `GET /inference/history` - Get own/all history
- `GET /inference/history/{user_id}` - Get user's history (admin)

## Configuration

Environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/asl_db

# JWT
SECRET_KEY=<change-me-32-chars>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin user seed
ADMIN_EMAIL=admin@asl.app
ADMIN_PASSWORD=ChangeMe123!

# ML models
LETTER_MODEL_PATH=ml_models/asl_model_full.keras
WORD_MODEL_PATH=ml_models/word_model.keras
LETTER_LABEL_MAP_PATH=ml_models/label_map.json
WORD_LABEL_MAP_PATH=ml_models/word_label_map.json

# App
APP_ENV=development
CORS_ORIGINS=["http://localhost:5173"]
```

## Authentication

All protected endpoints require JWT token in header:

```bash
Authorization: Bearer <access_token>
```

Tokens expire after 30 minutes. Use refresh token to get new access token.

## Role-Based Access Control (RBAC)

Two roles:
- **Admin**: Full access to users, roles, and all prediction history
- **User**: Can register, login, run predictions, view only their own history

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py -v

# Run with asyncio support
pytest -v --tb=short
```

**Note:** Tests use in-memory SQLite and mock ML models (actual models not required).

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current
```

## Logging

Application logs are written to stdout with INFO level in development, ERROR in production.

To adjust logging level, set `LOG_LEVEL` in `.env`:
```bash
LOG_LEVEL=DEBUG  # More verbose
LOG_LEVEL=ERROR  # Less verbose
```

## Production Deployment

```bash
# Build image
docker build -t asl-backend:latest .

# Run with production settings
docker run \
  -e APP_ENV=production \
  -e SECRET_KEY=<long-random-secret> \
  -e DATABASE_URL=<production-db> \
  -p 8000:8000 \
  asl-backend:latest
```

Key production settings:
- Set `APP_ENV=production` (disables docs/redoc/openapi)
- Use strong `SECRET_KEY` (32+ chars)
- Use production database URL
- Set appropriate CORS origins
- Enable HTTPS/SSL in reverse proxy (Nginx/Apache)
- Use production ASGI server (Gunicorn with Uvicorn workers)

## Troubleshooting

**Models not loading:**
```bash
# Check model files exist in ml_models/
ls -la ml_models/
# Verify paths in .env match actual files
```

**Database connection error:**
```bash
# Check PostgreSQL is running
psql -U asl_user -d asl_db -c "SELECT 1"
# Or check Docker container: docker logs asl_db
```

**Permission denied errors:**
```bash
# In Docker: files are owned by appuser (UID 1000)
# For local: ensure proper file permissions
```

## Development Guidelines

1. **Type hints everywhere** - Every function parameter and return type
2. **Async/await for all I/O** - Database, file, HTTP operations
3. **Business logic in services** - Not in routers
4. **RBAC through dependencies** - No inline authorization checks
5. **Error handling** - Use custom exceptions with proper logging
6. **Documentation** - Docstrings for classes and public functions

## License

[Your License Here]

## Contact

[Your Contact Info]
