#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-cinema}" > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Running migrations..."
npx drizzle-kit migrate --config=drizzle.config.ts

echo "Seeding database..."
npm run db:seed-prod

echo "Starting development server..."
exec npx tsx watch src/app.ts
