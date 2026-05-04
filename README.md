# SignSense - ASL Recognition Progressive Web App

A production-grade, full-stack application for real-time American Sign Language (ASL) recognition using machine learning and modern web technologies.

**Live Recognition** • **PWA** • **Role-Based Access** • **Inference Logging** • **Real-Time ML**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features](#features)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

SignSense is a complete ASL recognition system that enables users to:
- **Recognize individual letters** (A-Z) in real-time using hand landmarks
- **Recognize common phrases** as 30-frame sequences  
- **Track inference history** with session logging and analytics
- **Manage user accounts** with role-based access control (admin/user)
- **Work offline** as a fully functional Progressive Web App

The system combines:
- **Deep learning** (TensorFlow/Keras) for accurate ASL predictions
- **MediaPipe** for on-device hand landmark detection
- **FastAPI** for a scalable, async REST backend
- **React + TypeScript** for a modern, accessible frontend
- **PostgreSQL** for persistent user and inference data

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                 │
│  • Real-time camera access + MediaPipe hand detection  │
│  • Offline-capable with service worker                 │
│  • JWT token-based auth + auto-refresh                 │
│  • State management (Zustand) + API calls (Axios)      │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (HTTP/HTTPS)
┌────────────────────▼────────────────────────────────────┐
│              Backend (FastAPI + PostgreSQL)             │
│  • JWT authentication + RBAC                           │
│  • ML inference (letter & word models)                 │
│  • Session logging + inference history                 │
│  • User management + admin operations                  │
└────────────────────┬────────────────────────────────────┘
                     │ Async SQL
┌────────────────────▼────────────────────────────────────┐
│                  PostgreSQL Database                    │
│  • Users + Roles (RBAC)                                │
│  • Session logs + Inference results                    │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Frontend captures hand landmarks using MediaPipe (on-device)
2. Landmarks sent to backend API (/inference/letter or /inference/word)
3. Backend runs TensorFlow/Keras model inference
4. Predictions returned with confidence scores
5. Session logged to PostgreSQL for analytics

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | 0.111.0 |
| Language | Python | 3.11+ |
| Database | PostgreSQL | 15+ |
| ORM | SQLAlchemy | 2.0.31 (async) |
| Auth | JWT (python-jose) | 3.3.0 |
| Password | bcrypt | 4.2.0 |
| ML | TensorFlow/Keras | 2.16.1 / 3.13.2 |
| Server | Uvicorn + Gunicorn | 0.29.0 / 22.0.0 |

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.4.5 |
| Build | Vite | 5.2.12 |
| Routing | React Router | 6.23.1 |
| State | Zustand | 4.5.2 |
| Data Fetching | TanStack Query | 5.40.0 |
| HTTP Client | Axios | 1.7.2 |
| ML | MediaPipe Tasks | 0.10.14 |
| UI Framework | Tailwind CSS | 3.4.4 |
| Animations | Framer Motion | 11.2.10 |
| Forms | React Hook Form | 7.51.5 |
| Validation | Zod | 3.23.8 |

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Alembic
- **Testing**: Pytest (backend), Vitest (frontend)

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended) OR
- **Python 3.11+** + **Node.js 18+** + **PostgreSQL 15**
- **ML Models**: Place these files in `backend/ml_models/`:
  - `asl_model_full.keras` (letter recognition)
  - `word_model.keras` (word recognition)
  - `label_map.json` (letter labels)
  - `word_label_map.json` (word labels)
  - `hand_landmarker.task` (MediaPipe model)

### Option 1: Docker Compose (Easiest)

```bash
# 1. Clone repository
cd final_sign_languge

# 2. Set up environment
cp backend/.env.example backend/.env
mkdir -p backend/ml_models
# Copy ML model files to backend/ml_models/

# 3. Start all services
docker-compose -f backend/docker-compose.yml up -d

# 4. Verify services
curl http://localhost:8000/health       # Backend health
curl http://localhost:8000/docs         # Swagger API docs
# Frontend available at http://localhost:5173 (if configured)
```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL
createdb asl_db
createuser asl_user -P  # Set password interactively

# Configure environment
cp .env.example .env
# Edit .env with:
# - DATABASE_URL=postgresql+asyncpg://asl_user:password@localhost/asl_db
# - SECRET_KEY=<generate-a-random-key>
# - ALGORITHM=HS256

# Run migrations
alembic upgrade head

# Start server
python -m uvicorn app.main:app --reload
# API available at http://localhost:8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy MediaPipe model (from backend)
cp ../backend/ml_models/hand_landmarker.task ./public/models/

# Create environment file
cp .env.example .env

# Start development server
npm run dev
# Frontend available at http://localhost:5173
```

---

## 📁 Project Structure

### Backend
```
backend/
├── app/
│   ├── core/                  # Security, dependencies, exceptions
│   │   ├── security.py        # JWT token handling
│   │   ├── dependencies.py    # FastAPI dependency injections
│   │   └── exceptions.py      # Custom exception classes
│   │
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── user.py            # User model with roles
│   │   ├── role.py            # Role enum (admin/user)
│   │   └── session_log.py     # Inference session logs
│   │
│   ├── schemas/               # Pydantic request/response models
│   │   ├── auth.py            # Auth DTOs
│   │   ├── user.py            # User DTOs
│   │   └── inference.py       # Inference request/response
│   │
│   ├── routers/               # API endpoint handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── users.py           # User management endpoints
│   │   └── inference.py       # ML inference endpoints
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth_service.py    # User authentication
│   │   ├── user_service.py    # User CRUD + RBAC
│   │   └── inference_service.py # Model prediction logic
│   │
│   ├── ml/                    # Machine learning utilities
│   │   ├── model_registry.py  # Model loading + caching
│   │   └── preprocessor.py    # Data preprocessing
│   │
│   ├── main.py                # FastAPI app factory
│   ├── config.py              # Pydantic settings
│   └── database.py            # SQLAlchemy async setup
│
├── migrations/                # Alembic database migrations
├── tests/                     # Pytest unit tests
├── ml_models/                 # Pre-trained model files (git-ignored)
├── requirements.txt           # Python dependencies
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
└── Makefile
```

### Frontend
```
frontend/
├── src/
│   ├── api/                   # Backend API client
│   │   ├── client.ts          # Axios instance + interceptors
│   │   ├── auth.ts            # Auth API calls
│   │   ├── users.ts           # User API calls
│   │   └── inference.ts       # Inference API calls
│   │
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── GlassCard.tsx      # Glassmorphism panels
│   │   │   ├── PrimaryButton.tsx  # CTA button
│   │   │   ├── Badge.tsx          # Status badge
│   │   │   ├── ConfidenceBar.tsx  # Animated confidence bar
│   │   │   ├── LoadingSpinner.tsx # Loading state
│   │   │   └── ...
│   │   │
│   │   ├── camera/            # Camera-specific components
│   │   │   ├── CameraView.tsx      # Video element wrapper
│   │   │   ├── LandmarkOverlay.tsx # Hand skeleton canvas
│   │   │   ├── PredictionPanel.tsx # Results display
│   │   │   └── ModeToggle.tsx      # Letter/Word mode switch
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── TopBar.tsx     # Header with navigation
│   │   │   ├── BottomNav.tsx  # 4-tab navigation bar
│   │   │   └── ProtectedRoute.tsx # Auth guard
│   │   │
│   │   └── admin/             # Admin-specific components
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCamera.ts       # Camera stream management
│   │   ├── useHandLandmarker.ts   # MediaPipe integration
│   │   ├── useLetterMode.ts   # Single-frame prediction
│   │   ├── useWordMode.ts     # 30-frame sequence prediction
│   │   ├── useAuth.ts         # Authentication state
│   │   └── useInferenceHistory.ts # Query inference history
│   │
│   ├── pages/                 # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── RecognitionPage.tsx   # Main recognition UI
│   │   ├── HistoryPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   └── DashboardPage.tsx
│   │
│   ├── stores/                # Zustand state stores
│   │   ├── authStore.ts       # Auth state (tokens, user)
│   │   └── cameraStore.ts     # Camera state
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── inference.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── cn.ts              # Classname helper
│   │   ├── landmarkUtils.ts   # Hand landmark utilities
│   │   └── tokenManager.ts    # Token storage/retrieval
│   │
│   ├── App.tsx                # Main app component with routing
│   └── main.tsx               # React DOM render entry point
│
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── icons/                 # PWA icons (multiple sizes)
│   └── models/                # MediaPipe model files
│
├── vite.config.ts             # Vite build configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # npm dependencies + scripts
```

---

## ✨ Features

### Recognition Capabilities
- **Letter Recognition**: Real-time single-frame ASL letter recognition (A-Z)
- **Word Recognition**: 30-frame sequence recognition for common phrases
- **Hand Detection**: MediaPipe-based automatic hand pose detection
- **Confidence Scores**: All predictions include confidence metrics

### User Experience
- **Real-Time Feedback**: Live hand skeleton overlay on video
- **Smooth Animations**: Framer Motion for polished UI transitions
- **Accessibility**: WCAG 2.1 Level AA compliance with keyboard navigation
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **Offline Support**: Fully functional PWA with service worker

### Authentication & Security
- **JWT Tokens**: Secure, stateless authentication
- **Auto Token Refresh**: Automatic refresh token rotation (30 min access / 7 day refresh)
- **Password Security**: bcrypt hashing with cost factor 12
- **Role-Based Access Control**: Admin and user roles with strict permissions
- **Session Management**: Token blacklisting on logout

### Data Management
- **Inference Logging**: Every prediction session logged to database
- **Inference History**: Users can view their previous results
- **Admin Analytics**: Admins can view all user sessions and statistics
- **Pagination**: Efficient large dataset handling

### DevOps & Deployment
- **Docker Containerization**: Complete Docker + Docker Compose setup
- **Database Migrations**: Alembic for version-controlled schema changes
- **Async Database**: SQLAlchemy 2.x async for high-performance DB access
- **CORS Support**: Configured for cross-origin requests
- **Health Checks**: `/health` endpoint for monitoring

---

## 💻 Development

### Running Tests

**Backend:**
```bash
cd backend
pytest tests/                          # Run all tests
pytest tests/test_auth.py -v           # Run specific test file
pytest -k "test_login" -v              # Run by test name pattern
pytest --cov=app tests/                # With coverage report
```

**Frontend:**
```bash
cd frontend
npm run test                           # Run Vitest
npm run test -- --coverage            # With coverage
npm run lint                           # TypeScript type checking
```

### Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database Development**
   ```bash
   # Create a new migration
   cd backend
   alembic revision --autogenerate -m "Add new column"
   alembic upgrade head
   ```

4. **API Documentation**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Code Style & Standards
- **Python**: PEP 8 via black/flake8
- **TypeScript**: Prettier + ESLint configured in frontend
- **Database**: Alembic migrations required for schema changes
- **Tests**: Pytest (backend) + Vitest (frontend) required for all features

---

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
docker build -t signsense-backend:latest .
docker run -p 8000:8000 --env-file .env signsense-backend:latest
```

**Frontend:**
```bash
cd frontend
npm run build                          # Creates optimized dist/
npm run preview                        # Test production build locally
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
SECRET_KEY=<generate-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

### Docker Compose (Production)

```bash
docker-compose -f backend/docker-compose.yml up -d --build
```

---

## 📚 API Documentation

### Authentication Endpoints

**POST `/auth/register`**
- Public endpoint
- Request: `{ email, password, full_name }`
- Response: `{ user: { id, email, full_name, role }, tokens: { access_token, refresh_token } }`

**POST `/auth/login`**
- Public endpoint
- Request: `{ email, password }`
- Response: `{ access_token, refresh_token, token_type }`

**POST `/auth/refresh`**
- Protected endpoint
- Request: `{ refresh_token }`
- Response: `{ access_token, refresh_token }`

**POST `/auth/logout`**
- Protected endpoint
- Invalidates refresh token

### User Endpoints

**GET `/users/me`**
- Protected, any user
- Returns: Current user profile

**PUT `/users/me`**
- Protected, any user
- Update own profile

**GET `/users/`**
- Protected, admin only
- Paginated list of all users

**PUT `/users/{user_id}/role`**
- Protected, admin only
- Change user role (admin/user)

### Inference Endpoints

**POST `/inference/letter`**
- Protected, any user
- Request: `{ landmarks: [[x, y, z], ...] }` (21 landmarks)
- Response: `{ prediction: "A", confidence: 0.95, session_id }`

**POST `/inference/word`**
- Protected, any user
- Request: `{ frames: [[[x, y, z], ...], ...] }` (30 × 21 landmarks)
- Response: `{ prediction: "HELLO", confidence: 0.89, session_id }`

**GET `/inference/history`**
- Protected, any user
- Paginated list of user's inference sessions

Full API docs available at `/docs` (Swagger UI) when backend is running.

---

## 🔍 Troubleshooting

### Backend Issues

**"Module not found" or import errors:**
```bash
pip install -r requirements.txt
pip list | grep tensorflow  # Verify versions
```

**Database connection refused:**
```bash
# Check PostgreSQL is running
psql -U postgres -d asl_db

# Verify DATABASE_URL in .env
# Format: postgresql+asyncpg://user:password@localhost:5432/dbname
```

**Keras model loading fails:**
- Ensure exact versions: Keras 3.13.2, TensorFlow 2.16.1, numpy 1.26.4
- Model files must be in `backend/ml_models/`
- Check file permissions

### Frontend Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**MediaPipe model not loading:**
- Ensure `hand_landmarker.task` is in `public/models/`
- Check browser console for CORS errors
- Verify backend is serving models correctly

**Camera permission denied:**
- Check browser privacy settings
- App must be accessed via HTTPS in production
- Some browsers require user gesture to enable camera

---

## 📄 License

This project is provided as-is for educational and production use.

---

## 👥 Contributing

Contributions welcome! Please ensure:
1. Code follows project style guides
2. All tests pass
3. New features include tests
4. Database changes use Alembic migrations
5. API documentation is updated

---

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Review API documentation at `/docs`
3. Check database logs for backend errors
4. Check browser console for frontend errors

---

**SignSense © 2026** • Real-time ASL Recognition Made Simple
