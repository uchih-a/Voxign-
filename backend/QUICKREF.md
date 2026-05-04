# Quick Reference Guide - ASL Recognition Backend

## 🚀 Start Development (30 seconds)

```bash
cd /home/uchiha/Videos/final_sign_languge

# Option 1: Docker (easiest)
cp .env.example .env
mkdir -p ml_models
# Add model files to ml_models/
docker-compose up -d
curl http://localhost:8000/health

# Option 2: Local
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add model files to ml_models/
uvicorn app.main:app --reload
```

## 📚 Common Commands

```bash
# Run tests
pytest tests/ -v
pytest tests/ --cov=app

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "Description"

# Code quality
black app tests
flake8 app
mypy app

# Docker
docker-compose up -d    # Start
docker-compose down     # Stop
docker-compose logs -f  # Watch logs
```

## 🔐 Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe"
  }'

# 2. Login (get tokens)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# 3. Use access token
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer {access_token}"

# 4. Refresh token
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "{refresh_token}"}'
```

## 🧠 ML Inference

```bash
# Letter prediction (21 landmarks)
curl -X POST http://localhost:8000/inference/letter \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarks": [
      [0.5, 0.5, 0.5], [0.51, 0.51, 0.51], ...  // 21 total
    ]
  }'

# Word prediction (30 frames × 21 landmarks)
curl -X POST http://localhost:8000/inference/word \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": [
      [ [0.5, 0.5, 0.5], ... ],  // frame 1: 21 landmarks
      [ [0.5, 0.5, 0.5], ... ],  // frame 2
      ...                          // 30 total frames
    ]
  }'
```

## 🔌 API Endpoints

### Auth (`/auth`)
- `POST /auth/register` - Create account
- `POST /auth/login` - Get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token

### Users (`/users`)
- `GET /users/me` - Your profile
- `PUT /users/me` - Update your profile
- `GET /users/` - All users (admin only)
- `GET /users/{id}` - Specific user (admin only)
- `PUT /users/{id}` - Update user (admin only)
- `DELETE /users/{id}` - Deactivate user (admin only)
- `PUT /users/{id}/role` - Change role (admin only)

### Inference (`/inference`)
- `POST /inference/letter` - Predict letter
- `POST /inference/word` - Predict word
- `GET /inference/history` - Your/all history
- `GET /inference/history/{user_id}` - User history (admin)

### Health
- `GET /health` - Service status
- `GET /docs` - Swagger UI (dev only)

## 📊 Database Schema

**Roles table:**
- id (int, PK)
- name (string, unique): admin | user
- description (text)
- created_at (timestamp)

**Users table:**
- id (UUID, PK)
- email (string, unique)
- hashed_password (string)
- full_name (string, optional)
- role_id (int, FK → roles)
- refresh_token (string, hashed, optional)
- is_active (boolean, default true)
- created_at, updated_at (timestamps)

**SessionLogs table:**
- id (UUID, PK)
- user_id (UUID, FK → users, nullable)
- model_type (string): letter | word
- prediction (string)
- confidence (float 0.0-1.0)
- raw_scores (JSONB)
- input_snapshot (JSONB)
- created_at (timestamp)

## 🛡️ RBAC Rules

**User role:**
- ✅ Register, login, refresh, logout
- ✅ View own profile, update own profile
- ✅ Run predictions (letter, word)
- ✅ View own prediction history
- ❌ Cannot see other users

**Admin role:**
- ✅ Everything users can do
- ✅ List all users (paginated)
- ✅ View/update/delete any user
- ✅ Change user roles
- ✅ View all prediction history

## 🐛 Debugging

```bash
# Check if running
curl http://localhost:8000/health

# View logs
docker-compose logs -f api      # Docker
tail -f logs/*.log              # Local

# Check models
ls -lah ml_models/

# Test database
psql -U asl_user -d asl_db -c "SELECT COUNT(*) FROM users;"

# Run tests with verbose output
pytest tests/ -vv -s --tb=short
```

## 📝 Environment Variables

```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
SECRET_KEY=<32+ character secret>

# Optional (defaults provided)
APP_ENV=development
ADMIN_EMAIL=admin@asl.app
ADMIN_PASSWORD=ChangeMe123!
LETTER_MODEL_PATH=ml_models/asl_model_full.keras
WORD_MODEL_PATH=ml_models/word_model.keras
CORS_ORIGINS=["http://localhost:5173"]
```

## 🔧 Configuration Files

- `.env.example` - Template for environment variables
- `requirements.txt` - Python dependencies (pinned versions)
- `docker-compose.yml` - PostgreSQL + API services
- `Dockerfile` - Multi-stage build
- `alembic.ini` - Migration configuration
- `Makefile` - Convenient development commands

## 📖 Documentation

- [README.md](README.md) - Complete setup and usage guide
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Detailed implementation notes
- Swagger UI: `http://localhost:8000/docs` (development only)

## 🆘 Common Issues

**Models not loading:**
- Verify files in `ml_models/` directory
- Check paths in `.env` match actual files
- Run: `ls -la ml_models/`

**Database connection error:**
- In Docker: check `docker-compose logs db`
- Locally: verify PostgreSQL is running
- Test: `psql -U asl_user -d asl_db`

**Port already in use:**
- FastAPI: `lsof -i :8000 && kill -9 <PID>`
- PostgreSQL: `lsof -i :5432 && kill -9 <PID>`

**Import errors:**
- Ensure virtual env activated: `source venv/bin/activate`
- Reinstall deps: `pip install -r requirements.txt`

## ✅ Pre-Deployment Checklist

- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Update `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- [ ] Set `APP_ENV=production`
- [ ] Configure `CORS_ORIGINS` for production domain
- [ ] Verify model files exist in `ml_models/`
- [ ] Run migrations: `alembic upgrade head`
- [ ] Run tests: `pytest tests/`
- [ ] Test API: `curl http://localhost:8000/health`
- [ ] Setup reverse proxy (Nginx/Apache) with HTTPS
- [ ] Configure database backups
- [ ] Enable rate limiting
- [ ] Setup monitoring/alerting

## 📞 Support

Refer to README.md for complete documentation and troubleshooting guide.
