#!/bin/bash
set -e

echo ""
echo "================================"
echo "  PlantCare Setup"
echo "================================"
echo ""

# Check dependencies
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed. Please install Docker and try again."
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo "ERROR: Docker Compose is not available. Please install Docker Compose and try again."
  exit 1
fi

# Create .env from example if it doesn't exist, generating secure credentials
if [ ! -f ".env" ]; then
  echo "Generating .env with secure credentials..."

  DB_PASSWORD=$(openssl rand -base64 24 | tr -d '=/+' | head -c 32)
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '=/+' | head -c 64)

  sed \
    -e "s/DB_PASSWORD=plantcare_dev/DB_PASSWORD=${DB_PASSWORD}/" \
    -e "s/JWT_SECRET=dev_jwt_secret_change_in_production/JWT_SECRET=${JWT_SECRET}/" \
    .env.example > .env

  echo ".env created with randomly generated credentials."
  echo ""
  echo "  DB password: ${DB_PASSWORD}"
  echo "  JWT secret:  ${JWT_SECRET}"
  echo ""
  echo "  (saved in your .env file — keep it safe)"
  echo ""
else
  echo "Using existing .env file."
  echo ""
fi

echo "Building Docker containers (this may take a few minutes)..."
docker compose build

echo ""
echo "Starting database and Redis..."
docker compose up -d postgres redis
sleep 5

echo ""
echo "Creating database..."
docker compose run --rm api rails db:create

echo ""
echo "Running migrations..."
docker compose run --rm api rails db:migrate

echo ""
echo "Seeding database..."
docker compose run --rm api rails db:seed

echo ""
echo "Stopping background services..."
docker compose down

echo ""
echo "================================"
echo "  Setup complete!"
echo "================================"
echo ""
echo "To start PlantCare, run:"
echo ""
echo "  docker compose up"
echo ""
echo "Then open:"
echo "  API:    http://localhost:3000"
echo "  Client: http://localhost:5173"
echo ""
