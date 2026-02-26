# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OsmoX is a centralized multi-channel notification management system being transformed into a multi-tenant SaaS platform. It provides a unified API for sending notifications across email, SMS, WhatsApp, and push notifications. It is a monorepo with two independent applications, each with its own `node_modules` — always `cd` into the app directory before running npm commands.

```text
apps/
├── api/          # NestJS backend (Node.js 20.x, NestJS 11)
└── portal/       # Angular frontend (Angular 20, PrimeNG 20, Tailwind v4)
```

### Reference Implementation

The `~/work/osmosys/interview-app/` repository defines our coding standards for both frontend and backend. When implementing new patterns, check the interview-app for established conventions (auth flow, error handling, API design, component patterns).

### Multi-Tenant Architecture (In Progress)

- **Organization hierarchy**: Super Admin → Organization → Org Admin / Users
- **Role system**: ORG_USER (0), ORG_ADMIN (1), SUPER_ADMIN (2)
- **API versioning**: New endpoints under `/api/v1/` prefix; existing endpoints preserved for backward compatibility
- **Error format**: RFC 7807 Problem JSON for v1 endpoints; JSend format stays on existing endpoints
- **Response format**: Snake_case responses via SnakeCaseInterceptor on v1 endpoints
- **ORM**: TypeORM (NOT MikroORM); all tables prefixed with `notify_`
- **GraphQL**: Frozen (not removed); new features are REST-first

## Development Commands

### API (`apps/api`)

```bash
cd apps/api
npm install
cp .env.example .env         # First-time setup: configure DB, Redis, etc.

npm run start:dev             # Dev server with watch mode
npm run build                 # Production build

npm test                      # Run all unit tests (Jest)
npx jest --testPathPattern="providers.service" # Run a single test file
npm run test:watch            # Tests in watch mode
npm run test:cov              # Coverage report
npm run test:e2e              # E2E tests

npm run lint                  # ESLint (--max-warnings=0)
npm run lint:fix              # Auto-fix
npm run format                # Prettier

# Database migrations (TypeORM, must be run from apps/api)
npm run typeorm:run-migration       # Run pending migrations
npm run typeorm:revert-migration    # Revert last migration
npm run typeorm:create-migration    # Create empty migration
npm run typeorm:generate-migration  # Auto-generate from entity changes

# Scheduler (required for notification processing, run from apps/api)
./scheduler.sh
```

### Portal (`apps/portal`)

```bash
cd apps/portal
npm install

npm start                     # Dev server at localhost:4200
npm run build:prod            # Production build
npm test                      # Unit tests (Karma/Jasmine)

npm run lint                  # ESLint (--max-warnings=0)
npm run lint:fix              # Auto-fix
npm run lint-fix-format       # Combined: format + lint + format

npm run generate:api          # Regenerate TypeScript types from backend OpenAPI spec
```

## Architecture

### Data Flow

1. Client creates notification via REST or GraphQL API
2. Notification saved to PostgreSQL with `Pending` status
3. `scheduler.sh` (a bash loop running from `apps/api`) periodically POSTs to `/notifications/queue` and `/notifications/confirm` to enqueue pending notifications and check confirmations
4. Bull queues (Redis-backed) process notifications by channel type in parallel
5. Queue consumers call provider-specific services to deliver notifications
6. Status updated: `Pending` → `In Progress` → `Awaiting Confirmation` → `Success`/`Failed`
7. Completed notifications archived to `notify_archived_notifications` table

### Backend (`apps/api/src`)

**Entry point:** `main.ts` — sets up NestJS with Swagger (available at `/api`), global `ValidationPipe`, `HttpExceptionFilter` with JSend response format, and CORS.

**Module structure (`modules/`):**

- `notifications/` — Core notification CRUD and business logic
- `providers/` — Provider implementations, each in its own subdirectory:
  - `smtp/`, `mailgun/`, `aws-ses/` (email)
  - `sms-twilio/`, `sms-plivo/`, `sms-sns/` (SMS)
  - `wa-twilio/`, `wa-twilio-business/`, `wa360dialog/` (WhatsApp)
  - `push-sns/` (push), `vc-twilio/` (voice call)
- `master-providers/` — Provider type catalog with configuration schemas
- `provider-chains/` — Per-application fallback chains by notification type
- `provider-chain-members/` — Ordered members within a provider chain
- `applications/` — Application management (test mode, whitelisting)
- `auth/` — JWT authentication
- `server-api-keys/` — API key authentication
- `users/` — User management
- `webhook/` — Webhook configuration and delivery
- `archived-notifications/` — Completed notification archival and cleanup

**Job processing (`jobs/`):**

- `producers/notifications/` — Enqueues notification IDs to Bull queues
- `consumers/notifications/` — Processes queued notifications via provider services

**Common utilities (`common/`):**

- `constants/` — Database, notification, and miscellaneous constants
- `guards/` — `api-key/`, `gql-auth.guard.ts`, `role.guard.ts`
- `decorators/` — Custom validators (`is-data-valid`, `is-valid-whitelist`, `roles`)
- `jsend-formatter.ts` — All REST responses use JSend format
- `http-exception.filter.ts` — Global exception handler

**Database:**

- PostgreSQL with TypeORM; migrations in `src/database/migrations/`
- All tables prefixed with `notify_` (e.g., `notify_notifications`, `notify_providers`)
- `database-error.interceptor.ts` — Global interceptor for DB error handling

**GraphQL:** Auto-generated schema from code decorators (code-first approach); the `schema.gpl` file is auto-generated output. Playground available when `NODE_ENV=development`.

### Frontend (`apps/portal/src/app`)

- **Angular 20** with zoneless change detection (NO Zone.js), signals, standalone components
- **PrimeNG v20** for UI components, **Tailwind CSS v4** for utilities
- **OpenAPI-generated types** (`openapi-typescript`) — snake_case fields used directly, NO conversion
- `core/` — Singleton services, guards, interceptors, models, generated API types
- `features/` — Feature modules (lazy-loaded): dashboard, applications, providers, notifications, users, etc.
- `shared/` — Reusable components, pipes, directives
- `layout/` — App shell (Sakai-based): topbar, sidebar, menu, footer
- `pages/` — Non-feature pages: login, not-found

## Code Style

### API (TypeScript/NestJS)

- Airbnb style, 100-char line limit, Prettier formatting
- `@typescript-eslint/explicit-function-return-type: error` (with `allowExpressions: true`)
- `@typescript-eslint/no-explicit-any: error`
- `no-console: warn` — use Winston logger instead
- Blank lines required before/after block-like statements
- Zero warnings policy (`--max-warnings=0`)

### Portal (TypeScript/Angular 20)

- Standalone components only (NO NgModules)
- `ChangeDetectionStrategy.OnPush` on ALL components
- Signals for state (`signal()`, `computed()`), `input()`/`output()` functions (NOT decorators)
- `inject()` for DI (NOT constructor injection)
- Modern control flow: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitch`)
- `@typescript-eslint/no-explicit-any: error`
- Blank lines required before/after block-like statements
- Zero warnings policy (`--max-warnings=0`)

## Commit Message Convention

```text
<type>: <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `sample`

Rules: imperative present tense, no capitalization, no period, max 100 chars. Example: `feat: add WhatsApp provider support`

## Key Concepts

**Provider Chains:** Fallback sequences for notification delivery — if the primary provider fails, the next in the chain is tried. Configured per application and per notification type.

**Test Mode:** Applications can enable test mode with whitelisted recipients to prevent sending to real users during development.

**Notification Statuses:** `Pending` → `In Progress` → `Awaiting Confirmation` → `Success`/`Failed` → Archived

## Environment

Requires Node.js 20.x, PostgreSQL 16+, Redis 6+. See `apps/api/.env.example` for all configuration options including server, security (JWT, API keys), notification processing, logging, and database settings.

Docker Compose: `apps/api/docker-compose.yml` runs all services (PostgreSQL, Redis, API, Dozzle log viewer). See `apps/api/docs/docker-compose-usage.md` for details.
