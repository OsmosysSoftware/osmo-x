# Docker Compose Setup Guide

This document explains how to run the osmo-x API using Docker Compose. The single `docker-compose.yml` starts all required services: PostgreSQL, Redis, the API, and Dozzle (log viewer).

## Services

| Service | Purpose |
| --- | --- |
| `osmox-postgres` | PostgreSQL database with healthcheck |
| `osmox-redis` | Redis with AOF persistence and healthcheck |
| `osmox-api` | OsmoX API server (waits for healthy DB and Redis) |
| `osmox-dozzle` | Dozzle web UI for viewing container logs |
| `osmox-dozzle-auth-init` | One-shot init container that generates Dozzle auth |

## Quick Start

1. Copy and configure your environment file:

   ```shell
   cp .env.example .env
   # Edit .env with your database credentials, secrets, etc.
   ```

2. Start all services:

   ```shell
   docker compose up -d
   ```

3. Check that all services are healthy:

   ```shell
   docker compose ps
   ```

4. Access the services:
   - **API**: `http://localhost:3000` (or your configured `SERVER_PORT`)
   - **Swagger docs**: `http://localhost:3000/api`
   - **Dozzle logs**: `http://localhost:8080` (or your configured `DOZZLE_HOST_PORT`)

## Environment Variables for Docker

These variables in `.env` are used by the Docker Compose setup:

```env
# Database (used by osmox-postgres and osmox-api)
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=osmox_db
DB_DOCKER_PORT=5433          # Host port mapped to PostgreSQL

# Redis
REDIS_DOCKER_PORT=6397       # Host port mapped to Redis

# API
SERVER_PORT=3000             # API server port

# Docker
COMPOSE_PROJECT_NAME=osmo-x  # Used for container naming

# Dozzle (log viewer)
ADMIN_USER=admin             # Dozzle admin username
ADMIN_PASSWORD=your-password # Dozzle admin password
DOZZLE_HOST_PORT=8080        # Host port for Dozzle UI

# Logging
LOG_MAX_SIZE=10m             # Max container log file size
LOG_MAX_FILES=5              # Max rotated log files
```

> **Note:** `DB_HOST` and `REDIS_HOST` are overridden by the Docker Compose file to use container hostnames. You do not need to change them for the Docker setup.

## Commands

### Start services

```shell
docker compose up -d
```

### View logs

```shell
docker compose logs -f osmox-api    # Follow API logs
docker compose logs osmox-postgres  # View database logs
```

Or use Dozzle at `http://localhost:8080` for a web-based log viewer.

### Stop and remove

```shell
docker compose down       # Stop containers
docker compose down -v    # Stop and remove volumes (deletes data)
```

### Rebuild after code changes

```shell
docker compose up -d --build osmox-api
```

## Notes for Linux Users

- To fetch your machine's LAN IP (useful when connecting external services):

  ```shell
  hostname -I | awk '{print $1}'
  ```

- On Mac and Windows, you can use `host.docker.internal` to reference the host machine.
