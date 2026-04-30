#!/bin/sh
# Generates the runtime config consumed by the Angular portal at startup.
# Falls back to localhost defaults so the container still boots without env vars.
set -e

: "${API_URL:=http://localhost:3000}"
: "${API_DOCS_URL:=${API_URL}/docs}"

cat > /usr/share/nginx/html/assets/config.json <<EOF
{
  "apiUrl": "${API_URL}",
  "apiDocsUrl": "${API_DOCS_URL}"
}
EOF

exec nginx -g 'daemon off;'
