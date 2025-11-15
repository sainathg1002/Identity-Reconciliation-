#!/bin/bash

# Post-deploy script for Render
# This script runs after successful build/start to initialize the database
# Render will execute this automatically if present

set -e  # Exit on any error

echo "🚀 Post-deploy hook starting..."
echo "📍 Environment: $NODE_ENV"
echo "🔗 Database: $DATABASE_URL"

# Wait for database to be available
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
  if npm run db:init 2>/dev/null; then
    echo "✅ Database initialization successful!"
    exit 0
  fi
  echo "⌛ Attempt $i/30... retrying in 2 seconds"
  sleep 2
done

echo "❌ Failed to initialize database after 30 attempts"
exit 1
