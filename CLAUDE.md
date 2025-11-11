# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OsmoX is a centralized multi-channel notification management system that provides a unified API for sending notifications across email, SMS, WhatsApp, and push notifications. The project consists of two main applications:

- **API** (`apps/api`): NestJS backend that handles notification requests, queuing, and delivery
- **Portal** (`apps/portal`): Angular frontend for managing notifications and configurations

## Monorepo Structure

This is a monorepo with two independent applications. Each application has its own dependencies and must be set up separately:

```
apps/
├── api/          # NestJS backend (Node.js 20.x)
└── portal/       # Angular frontend (Angular 19)
```

## Common Development Commands

### API (apps/api)

```bash
cd apps/api

# Install dependencies
npm install

# Development
npm run start:dev           # Start dev server with watch mode
npm run start:debug         # Start with debugging

# Building
npm run build              # Build for production

# Testing
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests

# Linting & Formatting
npm run lint               # Lint with ESLint (max-warnings=0)
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format with Prettier

# Database Migrations
npm run typeorm:create-migration    # Create new migration
npm run typeorm:generate-migration  # Generate migration from entities
npm run typeorm:run-migration       # Run pending migrations
npm run typeorm:revert-migration    # Revert last migration
npm run database:reset              # Reset database

# Start scheduler (required for notification processing)
./scheduler.sh
```

### Portal (apps/portal)

```bash
cd apps/portal

# Install dependencies
npm install

# Development
npm start                  # Start dev server (localhost:4200)
ng serve                   # Alternative to npm start

# Building
npm run build              # Development build
npm run build:prod         # Production build

# Testing
npm test                   # Run unit tests with Karma

# Linting & Formatting
npm run lint               # Lint with ESLint (max-warnings=0)
npm run lint:fix           # Auto-fix linting issues
npm run prettier-format    # Format with Prettier
npm run lint-fix-format    # Combined: format + lint + format
```

## Architecture

### Backend Architecture (NestJS)

The API follows a modular NestJS architecture organized into:

**Core Modules** (`apps/api/src/modules/`):
- `auth/` - Authentication & JWT handling
- `notifications/` - Core notification CRUD and business logic
- `archived-notifications/` - Completed notification archival
- `providers/` - Provider-specific implementations (email, SMS, WhatsApp providers)
- `master-providers/` - Provider type catalog and configuration schemas
- `provider-chains/` - Per-application provider chains by type
- `provider-chain-members/` - Ordered members within provider chains
- `applications/` - Application management
- `users/` - User management
- `server-api-keys/` - API key authentication
- `webhook/` - Webhook configuration and delivery

**Job Processing** (`apps/api/src/jobs/`):
- `consumers/` - Bull queue consumers for processing notifications
- `producers/` - Queue producers that enqueue notification IDs

**Configuration** (`apps/api/src/config/`):
- `database/` - Database configuration
- `typeorm/` - TypeORM configuration and migrations
- `logger.config.ts` - Winston logger setup

**Data Flow:**
1. Client creates notification via REST/GraphQL API
2. Notification saved to PostgreSQL database with `Pending` status
3. Scheduler script periodically calls API endpoints to enqueue pending notifications
4. Bull queues (backed by Redis) process notifications by channel type in parallel
5. Queue consumers invoke provider-specific services to send notifications
6. Notification status updated based on provider response
7. Completed notifications eventually archived to `notify_archived_notifications` table

### Frontend Architecture (Angular)

The Portal is an Angular application using:
- **PrimeNG** for UI components
- **Apollo Client** for GraphQL communication with the API
- **Modular routing** with lazy-loaded modules

Structure (`apps/portal/src/app/`):
- `auth/` - Authentication guards and services
- `graphql/` - Apollo Client configuration and GraphQL queries
- `views/` - Feature modules and components

## Database

**PostgreSQL** is required. Key tables:
- `notify_notifications` - Active notifications
- `notify_archived_notifications` - Completed/archived notifications
- `notify_providers` - Configured provider instances
- `notify_master_providers` - Provider type templates
- `notify_provider_chains` - Application-specific provider chains
- `notify_provider_chain_members` - Chain member ordering
- `notify_applications` - Application configurations
- `notify_users` - User accounts
- `notify_webhooks` - Webhook configurations

Migrations are managed via TypeORM and stored in `apps/api/src/database/migrations/`.

## Queue System

Uses **Bull** (backed by Redis) for job processing. Separate queues exist for each notification channel type (email, SMS, WhatsApp, etc.) to enable parallel processing.

The `scheduler.sh` script must run continuously to:
- Process pending notifications
- Confirm awaiting confirmations
- Archive completed notifications

## Code Style

### API (TypeScript/NestJS)
- Airbnb JavaScript Style Guide with 100-character line limit
- ESLint enforces explicit return types, no `any` types, no unused vars
- Prettier for code formatting
- **Blank lines required before/after block-like statements**
- **Max warnings: 0** - linting must pass with zero warnings

### Portal (TypeScript/Angular)
- Airbnb TypeScript configuration
- ESLint + Prettier integration
- **Max warnings: 0** - linting must pass with zero warnings

## Environment Setup

### Prerequisites
- Node.js 20.x (use `nvm install 20 && nvm use 20`)
- PostgreSQL 16.x or higher
- Redis 6.x or higher
- Git 2.x or higher

### Local Development Setup

1. Clone and install API dependencies:
   ```bash
   cd apps/api
   npm install
   cp .env.example .env  # Configure DB, Redis, etc.
   ```

2. Run database migrations:
   ```bash
   npm run typeorm:run-migration
   ```

3. Start API server:
   ```bash
   npm run start:dev
   ```

4. Start scheduler (in separate terminal):
   ```bash
   ./scheduler.sh
   ```

5. Install and start Portal (in separate terminal):
   ```bash
   cd apps/portal
   npm install
   npm start  # Runs on localhost:4200
   ```

## Testing Strategy

- **Unit tests**: Jest for API, Jasmine/Karma for Portal
- **E2E tests**: Available for API via `npm run test:e2e`
- All features/bug fixes must include tests
- Coverage reports available via `npm run test:cov` (API)

## Commit Message Convention

Follow **strict commit message format**:

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `sample`

**Rules**:
- Use imperative, present tense: "change" not "changed"
- No capitalization of first letter
- No period at end of subject
- Max 100 characters per line
- Footer for breaking changes and issue references

**Example**: `feat: add WhatsApp provider support`

## Key Concepts

### Provider Chains
Provider chains define fallback sequences for notification delivery. If the primary provider fails, the system automatically tries the next provider in the chain. Chains are configured per application and per provider type.

### Test Mode
Applications can enable test mode with whitelisted recipients to prevent notifications from being sent to real users during development/testing.

### Notification Lifecycle
1. `Pending` - Created, waiting to be queued
2. `In Progress` - Being processed by queue consumer
3. `Awaiting Confirmation` - Sent to provider, waiting for delivery confirmation
4. `Success` / `Failed` - Final delivery status
5. Archived - Moved to `notify_archived_notifications` after completion

## GraphQL API

The API exposes both REST and GraphQL endpoints. GraphQL schema is defined in `apps/api/src/schema.gpl`.

## Documentation

Comprehensive docs in `apps/api/docs/`:
- `development-setup.md` - Local setup guide
- `production-setup.md` - Production deployment
- `usage-guide.md` - API usage examples
- `database-design.md` - Complete database schema
- `block-diagram.md` - System architecture diagram
- `add-new-provider.md` - Guide for adding notification providers
- `api-documentation.md` - API endpoint reference
- `webhook-guide.md` - Webhook configuration
- `test-mode-guide.md` - Test mode usage

## Important Notes

- **Each app has separate node_modules**: Always `cd` into `apps/api` or `apps/portal` before running npm commands
- **Scheduler is required**: Notifications won't process without `scheduler.sh` running
- **Zero warnings policy**: All linting must pass with `--max-warnings=0`
- **Database migrations**: Always run migrations after pulling changes that modify the schema
