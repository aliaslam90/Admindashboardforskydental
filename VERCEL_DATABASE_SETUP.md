# Setting Up Cloud Database for Vercel Deployment

This guide will help you set up a cloud PostgreSQL database for your Vercel deployment so your client can test the dashboard.

## Option 1: Vercel Postgres (Recommended - Easiest)

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a plan (Hobby plan is free for testing)
6. Select a region closest to your users
7. Click **Create**

### Step 2: Get Connection String

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Vercel automatically creates `POSTGRES_URL` environment variable
3. Copy the connection string (it looks like: `postgres://user:password@host:port/database?sslmode=require`)

### Step 3: Export Data from Docker

Run this command to export your local database:

```bash
# Export database from Docker
docker exec dental_postgres pg_dump -U dental_user -d dental_db > database_backup.sql
```

Or if using docker-compose:

```bash
docker-compose exec postgres pg_dump -U dental_user -d dental_db > database_backup.sql
```

### Step 4: Import Data to Vercel Postgres

1. Install `psql` locally or use Vercel's database dashboard
2. Connect to your Vercel Postgres using the connection string:

```bash
psql "YOUR_POSTGRES_URL_FROM_VERCEL"
```

3. Import the data:

```bash
psql "YOUR_POSTGRES_URL_FROM_VERCEL" < database_backup.sql
```

### Step 5: Verify Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables** in Vercel
2. Ensure `POSTGRES_URL` is set (should be automatic)
3. Add other required variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key-here` (generate a strong random string)
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`

### Step 6: Redeploy

1. Push your code changes (the updated `app.module.ts`)
2. Vercel will automatically redeploy
3. Your app will now connect to the cloud database!

---

## Option 2: Neon (Free Tier Available)

### Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project

### Step 2: Get Connection String

1. In Neon dashboard, go to your project
2. Click **Connection Details**
3. Copy the connection string (it will be in format: `postgres://user:password@host/database?sslmode=require`)

### Step 3: Export from Docker

Same as Option 1, Step 3:

```bash
docker exec dental_postgres pg_dump -U dental_user -d dental_db > database_backup.sql
```

### Step 4: Import to Neon

1. Use Neon's SQL Editor or connect via `psql`:

```bash
psql "YOUR_NEON_CONNECTION_STRING" < database_backup.sql
```

### Step 5: Configure Vercel

1. In Vercel project → **Settings** → **Environment Variables**
2. Add:
   - `POSTGRES_URL` = Your Neon connection string
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
   - `FRONTEND_URL=https://your-app.vercel.app`

---

## Option 3: Supabase (Free Tier Available)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Wait for project to initialize

### Step 2: Get Connection String

1. Go to **Project Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** connection string

### Step 3: Export and Import

Same process as above - export from Docker, import to Supabase.

---

## Quick Migration Script

Create a file `migrate-to-cloud.sh`:

```bash
#!/bin/bash

# Export from Docker
echo "Exporting database from Docker..."
docker exec dental_postgres pg_dump -U dental_user -d dental_db > database_backup.sql

# Prompt for cloud connection string
read -p "Enter your cloud PostgreSQL connection string: " CLOUD_URL

# Import to cloud
echo "Importing to cloud database..."
psql "$CLOUD_URL" < database_backup.sql

echo "Migration complete!"
```

Make it executable:
```bash
chmod +x migrate-to-cloud.sh
./migrate-to-cloud.sh
```

---

## Important Notes

1. **SSL Required**: Cloud databases require SSL connections. The updated `app.module.ts` handles this automatically.

2. **Synchronize Setting**: In production, `synchronize` is set to `false` for safety. Make sure your schema is already created via migration or import.

3. **Seed Data**: After importing, you may want to run your seed script to populate initial data:

```bash
# If you have a seed endpoint
curl -X POST https://your-app.vercel.app/api/seed
```

4. **Environment Variables**: Always set these in Vercel:
   - `POSTGRES_URL` (or `DATABASE_URL`)
   - `NODE_ENV=production`
   - `JWT_SECRET` (use a strong random string)
   - `FRONTEND_URL` (your Vercel app URL)

---

## Testing the Connection

After deployment, test your API:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test an endpoint
curl https://your-app.vercel.app/api/services
```

---

## Troubleshooting

**Connection refused:**
- Check that `POSTGRES_URL` is set in Vercel environment variables
- Verify the connection string format
- Ensure SSL is enabled (`?sslmode=require`)

**Authentication failed:**
- Verify username and password in connection string
- Check database user permissions

**Schema not found:**
- Run migrations or import your schema
- Check that `synchronize` is working (only in non-production)

---

## Cost Comparison

- **Vercel Postgres**: Free tier (256 MB), then $0.10/GB
- **Neon**: Free tier (0.5 GB), then pay-as-you-go
- **Supabase**: Free tier (500 MB), then $25/month

For client testing, the free tiers should be sufficient!
