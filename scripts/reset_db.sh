#!/bin/bash

echo "Stopping api and sidekiq to release DB connections..."
docker compose stop api sidekiq

echo "Resetting development database..."
echo "================="
docker compose run --rm api sh -c "rails db:drop db:create db:migrate db:seed"

echo "Resetting test database (loads from schema.rb)..."
echo "================="
docker compose run --rm api rails db:test:prepare

echo "Flushing Redis (clears stale Sidekiq jobs referencing old user IDs)..."
docker compose exec -T redis redis-cli FLUSHALL

echo "Restarting services..."
docker compose start api sidekiq

echo "Done!"
