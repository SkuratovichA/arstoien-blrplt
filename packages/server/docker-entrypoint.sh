#!/bin/sh
set -e

echo "=== Database Setup ==="

# Extract database credentials from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="${DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# Parse DATABASE_URL to get database name and connection info
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Connection string without database name (for creating DB)
POSTGRES_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres"

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Check if database exists, create if it doesn't
echo "Checking if database exists..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || {
  echo "Database '$DB_NAME' does not exist. Creating..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE \"$DB_NAME\";"
  echo "Database created successfully!"
}

echo "Database exists. Running migrations..."
npx prisma migrate deploy

echo ""
echo "=== Starting Server ==="
exec node dist/main.js