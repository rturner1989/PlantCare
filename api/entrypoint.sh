#!/bin/bash
set -e

# Remove a potentially pre-existing server.pid for Rails.
rm -f /plant-care-api/tmp/pids/server.pid

exec "$@"
