# Development Setup

This document outlines the steps required to set up OsmoX for development. By following these steps, you'll be able to run the API and Portal locally.

## Prerequisites

Before setting up OsmoX for development, ensure you have the following:

- **Node.js** v20.x or higher (use [NVM](https://github.com/nvm-sh/nvm) to manage versions)
- **Git** v2.x or higher
- **Docker** and **Docker Compose** (recommended for running PostgreSQL and Redis)

> **Note:** You can run PostgreSQL and Redis natively instead of Docker, but Docker is the recommended approach.

## Quick Start (Docker — Recommended)

This starts all services (API, PostgreSQL, Redis, Dozzle log viewer) in Docker containers.

### 1. Clone and configure

```bash
git clone https://github.com/OsmosysSoftware/osmo-x.git
cd osmo-x/apps/api
cp .env.example .env
```

Edit `.env` with your preferred settings. Key values to review:

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@osmox.dev` | Email for the seeded admin user |
| `ADMIN_PASSWORD` | `Admin123` | Password for the seeded admin user |
| `DB_USERNAME` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_NAME` | — | PostgreSQL database name |
| `JWT_SECRET` | — | Secret key for JWT tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | Secret key for refresh tokens (min 32 chars) |

### 2. Start services

```bash
docker compose up -d
```

### 3. Run database migrations

```bash
docker exec osmo-x-api npm run typeorm:run-migration
```

This creates all tables and seeds the admin user with the credentials from your `.env` file.

### 4. Verify

- **API**: <http://localhost:3000>
- **Swagger docs**: <http://localhost:3000/api>
- **Dozzle logs**: <http://localhost:8080>

### 5. Login

Use the admin credentials you configured (defaults: `admin@osmox.dev` / `Admin123`).

For more Docker options, see [Docker Compose Usage](docker-compose-usage.md).

## Portal Setup

The portal is the Angular frontend for managing notifications, providers, and applications.

### Docker (Recommended)

The portal's runtime config (`apiUrl`, `apiDocsUrl`) lives in a host file at `apps/portal/runtime-config/config.json`, bind-mounted into the container. To repoint the portal at a different backend, you edit that JSON file on the host — no container restart, no rebuild.

#### First-time setup

```bash
cd osmo-x/apps/portal
cp .env.example .env

mkdir -p runtime-config
cp runtime-config.example.json runtime-config/config.json
# (optional) edit runtime-config/config.json to point at your backend

docker compose up -d --build
```

The portal will be available at <http://localhost:4200> (or whichever `SERVER_PORT` you set in `.env`).

#### Day-to-day

To repoint at a different backend, edit `apps/portal/runtime-config/config.json` and refresh the browser. That's it — no `docker compose up`, no restart, no rebuild. nginx serves the host file directly through the bind mount.

#### Required env vars (`apps/portal/.env`)

| Variable | Notes |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | Docker project namespace |
| `SERVER_PORT` | Host port the container binds to (`127.0.0.1` only) |

`apiUrl` / `apiDocsUrl` are NOT environment variables — they're fields in `runtime-config/config.json`.

#### Common operations

```bash
docker compose stop                                       # stop, keep container
docker compose down                                       # stop + remove
docker compose logs -f                                    # tail logs
docker exec osmox-portal cat /runtime-config/config.json  # verify what's being served
```

### Development mode

For active development with hot-reload:

```bash
cd osmo-x/apps/portal
npm install
npm start
```

The dev server runs at <http://localhost:4200>. The portal connects to the API at `http://localhost:3000` by default. In dev mode the URL comes from the committed default at `apps/portal/src/assets/config.json` — edit it locally to point at a different backend, or use the Docker workflow described above.

### Login to Portal

Open <http://localhost:4200> and log in with your admin credentials:

| Field | Default Value |
| --- | --- |
| Email | `admin@osmox.dev` |
| Password | `Admin123` |

> These are set during the initial migration via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the API's `.env` file. Change the password from the portal's profile page after first login.

## Native Development Setup (Without Docker for API)

If you prefer to run the API natively (without Docker), you need PostgreSQL and Redis running locally.

### 1. Prerequisites

```bash
# Ensure PostgreSQL and Redis are running
sudo systemctl status redis
sudo systemctl status postgresql
```

### 2. Clone and configure

```bash
git clone https://github.com/OsmosysSoftware/osmo-x.git
cd osmo-x/apps/api
npm install
cp .env.example .env
```

Edit `.env` — set `DB_HOST=localhost`, `DB_PORT` to your PostgreSQL port, and configure database credentials.

### 3. Run migrations and start

```bash
npm run typeorm:run-migration
npm run start:dev
```

The API will be running at <http://localhost:3000>.

## Start the Scheduler

The scheduler is required for notification processing. It periodically triggers:

- Processing of `Pending` notifications
- Provider confirmation of `Awaiting Confirmation` notifications
- Archiving of completed notifications
- Deletion of old archived notifications (if enabled)

```bash
cd osmo-x/apps/api
./scheduler.sh
```

> In Docker mode, the scheduler runs automatically inside the API container.

## Default Admin Credentials

The initial migration seeds an admin user. Credentials are configurable via environment variables:

| Env Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@osmox.dev` | Admin login email |
| `ADMIN_PASSWORD` | `Admin123` | Admin login password |

The admin user is created with the `SUPER_ADMIN` role, which has full platform access.

> **Important:** Change the default password in production. You can update it from the portal's profile page or by setting `ADMIN_PASSWORD` before running migrations.

## Next Steps

- [Usage Guide](usage-guide.md) — How to configure providers and send notifications
- [Docker Compose Usage](docker-compose-usage.md) — Advanced Docker configuration
- [API Documentation](api-documentation.md) — Full API reference
