#!/bin/sh
# Verifies that the host-managed runtime config is present, then starts nginx.
#
# The portal reads /assets/config.json at bootstrap (see ConfigService).
# nginx aliases that URL to /runtime-config/config.json (see nginx.conf),
# which is bind-mounted from the host directory ./runtime-config in
# docker-compose.yml. To change apiUrl, edit the host file — nginx serves
# the new value on the next browser refresh, no container restart needed.
set -e

CONFIG_PATH=/runtime-config/config.json

if [ ! -f "$CONFIG_PATH" ]; then
  echo "ERROR: $CONFIG_PATH is missing." >&2
  echo "" >&2
  echo "First-time setup (run from apps/portal/):" >&2
  echo "  mkdir -p runtime-config" >&2
  echo "  cp runtime-config.example.json runtime-config/config.json" >&2
  echo "" >&2
  echo "Then re-run: docker compose up -d" >&2
  exit 1
fi

exec nginx -g 'daemon off;'
