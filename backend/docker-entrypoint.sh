#!/bin/sh

# Wait a moment for volume mount to settle
sleep 1

# Check if src directory exists and has files
if [ ! -d "src" ] || [ -z "$(ls -A src 2>/dev/null)" ]; then
  echo "ERROR: src directory is empty or doesn't exist!"
  echo "Please ensure your NestJS source files are in the src/ directory"
  echo "Current src directory contents:"
  ls -la src/ 2>/dev/null || echo "src directory doesn't exist"
  exit 1
fi

echo "Source files found. Proceeding with build..."

# Remove dist folder if it exists (clean start)
# Use find to avoid EBUSY errors with rmdir
find dist -type f -delete 2>/dev/null || true
rmdir dist 2>/dev/null || true

# Create fresh dist directory
mkdir -p dist

# Build the project
echo "Building NestJS application..."
npm run build 2>&1

# Check build output
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "ERROR: Build command failed with exit code $BUILD_EXIT_CODE"
  exit 1
fi

# Verify build
if [ ! -f "dist/main.js" ]; then
  echo "ERROR: Build completed but dist/main.js not found"
  echo "Checking dist directory:"
  ls -la dist/ 2>/dev/null || echo "dist directory is empty"
  echo ""
  echo "Checking if main.ts exists in src:"
  find src -name "main.ts" 2>/dev/null || echo "main.ts not found in src/"
  exit 1
fi

# Start in watch mode
echo "Build successful! Starting NestJS in watch mode..."
exec npm run start:watch

