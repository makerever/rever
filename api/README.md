# Rever API

This is the backend API for the Rever application, built with Django 5.2 and Django REST Framework.

## Prerequisites

- Python 3.12+
- Docker and Docker Compose (optional, for containerized setup)

## Environment Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd rever
   ```

2. Set up a virtual environment and install dependencies using `uv`:

   ```bash
   # Install uv if you don't have it
   # pip install uv

   # Create virtual environment and install dependencies
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate

   # Install all dependencies (including development dependencies)
   uv sync --dev
   ```

3. Create a `.env` file based on the example:

   ```bash
   cp api/.env.example rever/.env
   ```

4. Run migrations:

   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Running with Docker Compose

The easiest way to run the API locally is using Docker Compose, which sets up PostgreSQL, Redis, and MinIO services automatically.

1. Make sure Docker and Docker Compose are installed on your system

2. Start the services:
   ```bash
   docker-compose -f docker-compose-local.yaml up -d
   ```

## API Documentation

The API uses Django REST Framework. You can access the browsable API at:

- http://localhost:8000/api/
