#!/bin/bash

# Render post-deploy initialization script
# This runs automatically after successful build on Render

set -e

echo "================================================"
echo "🚀 Post-Deploy Database Initialization Starting"
echo "================================================"
echo ""
echo "📍 Environment: $NODE_ENV"
echo "🔗 Database URL: ${DATABASE_URL:0:50}..."
echo ""

# Function to check if database is ready
check_db_ready() {
  if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ ERROR: DATABASE_URL not set!"
    return 1
  fi
  
  # Try a simple query
  timeout 5 psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1
  return $?
}

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))
  if check_db_ready; then
    echo "✅ Database is ready!"
    break
  fi
  echo "   Attempt $attempt/$max_attempts... waiting 2 seconds"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Database did not become ready after $((max_attempts * 2)) seconds"
  exit 1
fi

echo ""
echo "📝 Running database migrations..."
echo ""

# Read and execute migration
MIGRATION_FILE="migrations/001_create_contacts_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ ERROR: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Execute migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE" 2>&1 | sed 's/^/   /'

echo ""
echo "🔍 Verifying table creation..."

# Verify table exists
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'contacts';" 2>/dev/null | xargs)

if [ "$TABLE_COUNT" -eq 1 ]; then
  echo "✅ Contacts table verified!"
  
  # Show schema
  echo ""
  echo "📋 Table Schema:"
  psql "$DATABASE_URL" -c "\d contacts" 2>&1 | sed 's/^/   /'
  
  echo ""
  echo "✅ Database initialization completed successfully!"
  echo ""
  echo "================================================"
  echo "🎉 Ready for API requests"
  echo "================================================"
  exit 0
else
  echo "❌ Failed to create contacts table"
  exit 1
fi
