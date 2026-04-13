#!/bin/bash

# Run npm install inside the running client container so that new deps
# land in the anonymous node_modules volume. Use this after pulling or
# editing client/package.json.

args="$*"
: "${args:=install}"

echo "Running 'npm $args' in client container..."
echo "================="

docker compose exec client npm $args
