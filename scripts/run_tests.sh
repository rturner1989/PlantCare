#!/bin/bash

echo "Running tests..."
echo "================="

docker compose run --rm -e RAILS_ENV=test api rails test "$@"
