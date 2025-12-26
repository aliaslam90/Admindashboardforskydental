# Quick Start Commands

## 🚀 Fastest Way to Get Started

### Prerequisites Check
```bash
# Check Node.js version (need 20+)
node --version

# Check if PostgreSQL is installed
psql --version
```

### Option A: Local Setup (5 minutes)

```bash
# 1. Create database
sudo -u postgres psql -c "CREATE DATABASE dental_clinic;"

# 2. Setup backend
cd backend
npm install
cp .env.example .env

# 3. Edit .env file (use nano, vim, or your editor)
nano .env
# Update these values:
# DB_USERNAME=postgres
# DB_PASSWORD=your_postgres_password
# JWT_SECRET=your-random-secret-key-here

# 4. Run backend
npm run start:dev
```

**Backend will be running at:** `http://localhost:3003/api`

### Option B: Docker Setup (3 minutes)

```bash
# 1. Start PostgreSQL container
docker run --name dental-postgres \
  -e POSTGRES_DB=dental_clinic \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14

# 2. Wait 5 seconds for DB to initialize, then setup backend
cd backend
npm install
cp .env.example .env

# 3. Update .env with Docker PostgreSQL settings
echo "DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=dental_clinic
JWT_SECRET=change-this-in-production
PORT=3003
NODE_ENV=development" > .env

# 4. Run backend
npm run start:dev
```

## 📋 Complete Setup Commands

### Step-by-Step Local Development

```bash
# === STEP 1: Database Setup ===
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE dental_clinic;
CREATE USER dental_user WITH PASSWORD 'dental_password';
GRANT ALL PRIVILEGES ON DATABASE dental_clinic TO dental_user;
\q
EOF

# === STEP 2: Backend Setup ===
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env (replace with your values)
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dental_user
DB_PASSWORD=dental_password
DB_NAME=dental_clinic
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
PORT=3003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOF

# === STEP 3: Run Backend ===
npm run start:dev
```

### Docker Compose Setup (All-in-One)

```bash
# Create docker-compose.yml with PostgreSQL (see below)
# Then run:
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

## 🔧 Common Commands

### Backend Commands
```bash
cd backend

npm install              # Install dependencies
npm run start:dev       # Development mode (watch)
npm run start:prod      # Production mode
npm run build           # Build for production
npm run lint            # Lint code
npm run format          # Format code
```

### Database Commands
```bash
# Connect to database
psql -U dental_user -d dental_clinic

# Or with postgres user
sudo -u postgres psql -d dental_clinic

# Inside psql:
\dt                     # List all tables
\d+ appointments        # Describe appointments table
\q                      # Quit
```

### Docker Commands
```bash
# Start PostgreSQL
docker start dental-postgres

# Stop PostgreSQL
docker stop dental-postgres

# View logs
docker logs dental-postgres

# Remove container
docker rm -f dental-postgres
```

## ✅ Verification Commands

```bash
# Test backend is running
curl http://localhost:3003/api

# Test database connection
psql -U dental_user -d dental_clinic -c "SELECT version();"

# Check if port is in use
lsof -i :3003        # macOS/Linux
netstat -ano | findstr :3003  # Windows
```

## 🐛 Troubleshooting Commands

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check if database exists
psql -U postgres -l | grep dental_clinic

# View backend logs
cd backend && npm run start:dev
# (logs will appear in terminal)

# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Environment Variables Template

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=dental_clinic
DB_SSL=false

JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3003
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

## 🎯 Quick Test After Setup

```bash
# 1. Check backend is running
curl http://localhost:3003/api

# 2. Test login endpoint (will fail without users, but confirms API works)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Check database tables were created
psql -U dental_user -d dental_clinic -c "\dt"
```

## 🚢 Production Deployment

```bash
cd backend

# Build
npm run build

# Set production environment
export NODE_ENV=production

# Run
npm run start:prod
```

Or with PM2:
```bash
npm install -g pm2
pm2 start dist/main.js --name dental-backend
pm2 save
pm2 startup
```

