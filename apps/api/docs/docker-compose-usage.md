# Docker Compose Setup Guide

This document explains how to run OsmoX using Docker Compose. The API's `docker-compose.yml` starts all required backend services: PostgreSQL, Redis, the API, and Dozzle (log viewer). The portal has its own `docker-compose.yml`.

## Services

### API (`apps/api/docker-compose.yml`)

| Service | Purpose |
| --- | --- |
| `osmox-postgres` | PostgreSQL database with healthcheck |
| `osmox-redis` | Redis with AOF persistence and healthcheck |
| `osmox-api` | OsmoX API server (waits for healthy DB and Redis) |
| `osmox-dozzle` | Dozzle web UI for viewing container logs |
| `osmox-dozzle-auth-init` | One-shot init container that generates Dozzle auth |

### Portal (`apps/portal/docker-compose.yml`)

| Service | Purpose |
| --- | --- |
| `osmox-portal` | Angular frontend served via Nginx |

## Quick Start

1. Copy and configure your environment file:

   ```shell
   cd apps/api
   cp .env.example .env
   # Edit .env with your database credentials, secrets, admin email/password, etc.
   ```

2. Start all backend services:

   ```shell
   docker compose up -d
   ```

3. Run database migrations (first time only, or after updates with new migrations):

   ```shell
   docker exec osmo-x-api npm run typeorm:run-migration
   ```

4. Start the portal:

   ```shell
   cd ../portal
   docker compose up -d --build
   ```

5. Check that all services are healthy:

   ```shell
   docker compose ps
   ```

6. Access the services:
   - **Portal**: `http://localhost:4200`
   - **API**: `http://localhost:3000` (or your configured `SERVER_PORT`)
   - **Swagger docs**: `http://localhost:3000/api`
   - **Dozzle logs**: `http://localhost:8080` (or your configured `DOZZLE_HOST_PORT`)

7. Log in to the portal with your admin credentials (defaults: `admin@osmox.dev` / `Admin123`). See [Default Admin Credentials](#default-admin-credentials) below.

## Default Admin Credentials

The initial migration seeds an admin user with configurable credentials:

| Env Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@osmox.dev` | Admin login email |
| `ADMIN_PASSWORD` | `Admin123` | Admin login password |

Set these in `.env` **before** running migrations. The admin is created with the `SUPER_ADMIN` role.

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

## Alternative Configurations

If you already have your own database or Redis, use the separate compose files:

| File | What it runs | Use when |
| --- | --- | --- |
| `docker-compose.yml` | API + PostgreSQL + Redis + Dozzle | Full stack (default) |
| `docker-compose.api.yml` | API only | You have your own DB and Redis |
| `docker-compose.db.yml` | API + PostgreSQL | You have your own Redis |
| `docker-compose.redis.yml` | API + Redis | You have your own DB |

```shell
# API only (configure DB_HOST, REDIS_HOST in .env to point to your services)
docker compose -f docker-compose.api.yml up -d

# API + PostgreSQL (configure REDIS_HOST in .env)
docker compose -f docker-compose.db.yml up -d

# API + Redis (configure DB_HOST in .env)
docker compose -f docker-compose.redis.yml up -d
```

When using external DB or Redis, set `DB_HOST`/`REDIS_HOST` in `.env` to your service address (e.g., `host.docker.internal` on Mac/Windows, or your machine's LAN IP on Linux).

## Notes for Linux Users

- To fetch your machine's LAN IP (useful when connecting external services):

  ```shell
  hostname -I | awk '{print $1}'
  ```

- On Mac and Windows, you can use `host.docker.internal` to reference the host machine.
