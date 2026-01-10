#!/bin/bash

# Database Migration Script: Docker → Cloud PostgreSQL
# This script exports your local Docker database and imports it to a cloud database

set -e

echo "🚀 Database Migration Script"
echo "============================"
echo ""

# Step 1: Export from Docker
echo "📤 Step 1: Exporting database from Docker..."
if docker ps | grep -q dental_postgres; then
    docker exec dental_postgres pg_dump -U dental_user -d dental_db > database_backup.sql
    echo "✅ Database exported to database_backup.sql"
elif docker-compose ps | grep -q postgres; then
    docker-compose exec -T postgres pg_dump -U dental_user -d dental_db > database_backup.sql
    echo "✅ Database exported to database_backup.sql"
else
    echo "❌ Error: Could not find running PostgreSQL container"
    echo "   Make sure Docker is running and your database container is up"
    exit 1
fi

# Step 2: Get cloud connection string
echo ""
echo "📥 Step 2: Importing to cloud database..."
read -p "Enter your cloud PostgreSQL connection string (POSTGRES_URL): " CLOUD_URL

if [ -z "$CLOUD_URL" ]; then
    echo "❌ Error: Connection string cannot be empty"
    exit 1
fi

# Step 3: Import to cloud
echo ""
echo "⏳ Importing data (this may take a moment)..."
if command -v psql &> /dev/null; then
    psql "$CLOUD_URL" < database_backup.sql
    echo "✅ Data imported successfully!"
else
    echo "⚠️  psql not found. Please install PostgreSQL client tools"
    echo "   Or manually import database_backup.sql using:"
    echo "   psql \"$CLOUD_URL\" < database_backup.sql"
    exit 1
fi

echo ""
echo "🎉 Migration complete!"
echo ""
echo "Next steps:"
echo "1. Set POSTGRES_URL in Vercel environment variables"
echo "2. Redeploy your application"
echo "3. Test the connection at: https://your-app.vercel.app/api/health"
