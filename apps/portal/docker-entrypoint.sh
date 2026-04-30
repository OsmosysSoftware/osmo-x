#!/bin/sh
# Generates the runtime config consumed by the Angular portal at startup.
#
# Default workflow ("env-var workflow"): the container regenerates
# /runtime-config/config.json from $API_URL / $API_DOCS_URL on every start, so
# changing .env + `docker compose up -d` is enough to repoint the portal at a
# different backend without rebuilding the image.
#
# Host-managed workflow: bind-mount a host directory containing config.json
# onto /runtime-config (directory mount, not file mount — file mounts break
# when editors atomic-write) AND set SKIP_RUNTIME_CONFIG_GENERATION=true. The
# entrypoint then leaves the host file alone, and edits to the host config.json
# are picked up live (next browser refresh) without restarting the container.
#
# nginx serves this file at /assets/config.json via an alias in nginx.conf.
set -e

CONFIG_PATH=/runtime-config/config.json

if [ "${SKIP_RUNTIME_CONFIG_GENERATION:-false}" = "true" ]; then
  if [ ! -f "$CONFIG_PATH" ]; then
    echo "SKIP_RUNTIME_CONFIG_GENERATION=true but $CONFIG_PATH is missing" >&2
    echo "Did you forget to bind-mount a directory containing config.json?" >&2
    exit 1
  fi
  echo "Using host-managed config at $CONFIG_PATH (skipping env-var generation)"
else
  : "${API_URL:=http://localhost:3000}"
  : "${API_DOCS_URL:=${API_URL}/docs}"

  cat > "$CONFIG_PATH" <<EOF
{
  "apiUrl": "${API_URL}",
  "apiDocsUrl": "${API_DOCS_URL}"
}
EOF
fi

exec nginx -g 'daemon off;'
