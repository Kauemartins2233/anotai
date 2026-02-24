#!/bin/bash
echo "Waiting for PostgreSQL..."
while ! python -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('postgresql://postgres:postgres@db:5432/projrob'))" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
