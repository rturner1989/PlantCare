#!/bin/bash

container_id=$($(dirname "$0")/get_app_container_id.sh)

echo "ROLLBACK api container with id $container_id..."
echo "================="

docker compose run --rm api rails db:rollback

echo "Finished!"
