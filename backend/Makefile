.PHONY: help install install-dev run run-dev test migrate docker-build docker-up docker-down clean lint format

help:
	@echo "ASL Recognition Backend - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install           Install production dependencies"
	@echo "  make install-dev       Install with development dependencies"
	@echo ""
	@echo "Running:"
	@echo "  make run               Run API server (production)"
	@echo "  make run-dev           Run API server (development with auto-reload)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate           Run database migrations"
	@echo "  make migrate-create    Create new migration (MIGRATION=name)"
	@echo ""
	@echo "Testing:"
	@echo "  make test              Run all tests"
	@echo "  make test-cov          Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint              Run linters (flake8, mypy)"
	@echo "  make format            Format code with black"
	@echo "  make format-check      Check formatting without changes"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build      Build Docker image"
	@echo "  make docker-up         Start Docker Compose stack"
	@echo "  make docker-down       Stop Docker Compose stack"
	@echo "  make docker-logs       Tail Docker Compose logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             Remove build artifacts and caches"
	@echo "  make clean-docker      Remove Docker containers and volumes"

install:
	pip install --upgrade pip
	pip install -r requirements.txt

install-dev:
	pip install --upgrade pip
	pip install -r requirements.txt pytest pytest-asyncio pytest-cov aiosqlite black flake8 mypy

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

run-dev:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=app --cov-report=html --cov-report=term

migrate:
	alembic upgrade head

migrate-create:
	alembic revision --autogenerate -m "$(MIGRATION)"

lint:
	flake8 app tests
	mypy app

format:
	black app tests

format-check:
	black --check app tests

docker-build:
	docker build -t asl-backend:latest .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +

clean-docker:
	docker-compose down -v
	docker image rm asl-backend:latest 2>/dev/null || true

.DEFAULT_GOAL := help
