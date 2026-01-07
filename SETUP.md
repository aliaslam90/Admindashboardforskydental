# Setup and Run Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## Option 1: Local Development Setup

### Step 1: Install PostgreSQL (if not already installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### Step 2: Create Database

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or connect directly (Windows)
psql -U postgres
```

Then in PostgreSQL shell:
```sql
CREATE DATABASE dental_clinic;
CREATE USER dental_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dental_clinic TO dental_user;
\q
```

### Step 3: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Step 4: Configure Environment Variables

Edit `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dental_user
DB_PASSWORD=your_password
DB_NAME=dental_clinic
DB_SSL=false

JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PORT=3003
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

### Step 5: Run Backend

```bash
# Development mode (with hot reload)
npm run start:dev

# Or production mode
npm run build
npm run start:prod
```

The backend will be available at: `http://localhost:3003/api`

### Step 6: Setup Frontend (Optional - for full stack)

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## Option 2: Docker Setup (Recommended)

### Step 1: Create PostgreSQL Docker Container

```bash
# Run PostgreSQL in Docker
docker run --name dental-postgres \
  -e POSTGRES_USER=dental_user \
  -e POSTGRES_PASSWORD=dental_password \
  -e POSTGRES_DB=dental_clinic \
  -p 5432:5432 \
  -d postgres:14

# Or use docker-compose (if you have a docker-compose.yml for DB)
```

### Step 2: Update Backend .env

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dental_user
DB_PASSWORD=dental_password
DB_NAME=dental_clinic
```

### Step 3: Run Backend

```bash
cd backend
npm install
npm run start:dev
```

## Option 3: Full Docker Compose Setup

### Step 1: Update docker-compose.yml

Make sure your `docker-compose.yml` includes PostgreSQL service:

```yaml
services:
  postgres:
    image: postgres:14
    container_name: dental-postgres
    environment:
      POSTGRES_USER: dental_user
      POSTGRES_PASSWORD: dental_password
      POSTGRES_DB: dental_clinic
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dental-network

  backend:
    # ... existing backend config
    depends_on:
      - postgres
    environment:
      - DB_HOST=postgres
      # ... other env vars

volumes:
  postgres_data:

networks:
  dental-network:
    driver: bridge
```

### Step 2: Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Quick Start Commands Summary

### Local Development (Quick Start)

```bash
# 1. Setup database
sudo -u postgres psql -c "CREATE DATABASE dental_clinic;"

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# 3. Run backend
npm run start:dev
```

### Docker Quick Start

```bash
# 1. Start PostgreSQL
docker run --name dental-postgres \
  -e POSTGRES_DB=dental_clinic \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:14

# 2. Wait a few seconds for DB to start, then setup backend
cd backend
npm install
cp .env.example .env
# Update .env with: DB_HOST=localhost, DB_USERNAME=postgres, DB_PASSWORD=postgres

# 3. Run backend
npm run start:dev
```

## Verify Installation

### Test Backend API

```bash
# Health check (if you have a health endpoint)
curl http://localhost:3003/api

# Or test login endpoint
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Check Database Connection

```bash
# Connect to PostgreSQL
psql -U dental_user -d dental_clinic

# List tables (after first run)
\dt

# Exit
\q
```

## Common Issues & Solutions

### Issue: Database connection error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Check database exists
psql -U postgres -l | grep dental_clinic
```

### Issue: Port already in use
```bash
# Find process using port 3003
lsof -i :3003  # macOS/Linux
netstat -ano | findstr :3003  # Windows

# Kill the process or change PORT in .env
```

### Issue: TypeORM synchronization errors
- Make sure database exists
- Check database credentials in .env
- Ensure PostgreSQL is running
- Check database user has proper permissions

## Development Workflow

```bash
# 1. Start PostgreSQL (if using local)
sudo systemctl start postgresql

# 2. Start backend in development mode
cd backend
npm run start:dev

# 3. In another terminal, start frontend (if needed)
cd frontend
npm run dev

# 4. Make changes - backend will auto-reload
# 5. Check logs in terminal for errors
```

## Production Deployment

```bash
# Build backend
cd backend
npm run build

# Set NODE_ENV=production in .env
# Set synchronize=false in database config

# Run production server
npm run start:prod
```

## Useful Commands

```bash
# Backend
npm run start:dev      # Development with watch
npm run start:debug   # Debug mode
npm run build         # Build for production
npm run start:prod    # Production mode
npm run lint          # Lint code
npm run format        # Format code

# Database
psql -U postgres -d dental_clinic  # Connect to DB
\dt                                  # List tables
\d+ table_name                       # Describe table
```

