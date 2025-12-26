# How to Run - Development Mode

## Quick Start

```bash
# 1. Make sure you're in the project root
cd /home/naveed/projects/practice/dental-appointment-system

# 2. Stop any existing containers
docker-compose down

# 3. Remove old volumes (if needed)
docker-compose down -v

# 4. Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

## Services

- **PostgreSQL**: `localhost:5432`
- **Backend API**: `http://localhost:3001/api`
- **Frontend**: `http://localhost:3000`

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Access backend container shell
docker exec -it dental_backend sh

# Access PostgreSQL
docker exec -it dental_postgres psql -U dental_user -d dental_db
```

## Troubleshooting

### If backend fails to start:
```bash
# Check logs
docker-compose logs backend

# Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### If database connection fails:
```bash
# Check if postgres is healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Clear everything and start fresh:
```bash
docker-compose down -v
docker-compose up --build
```

