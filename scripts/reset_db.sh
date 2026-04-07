#!/bin/bash

echo "Stopping api and sidekiq to release DB connections..."
docker compose stop api sidekiq

echo "Resetting database..."
echo "================="
docker compose run --rm api sh -c "rails db:drop db:create db:migrate db:seed"

echo "Restarting services..."
docker compose start api sidekiq

echo "Done!"
