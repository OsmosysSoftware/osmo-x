---
name: db-migration
description: Create, run, or revert TypeORM database migrations. Use when modifying entities, adding columns, creating tables, or troubleshooting database schema issues.
argument-hint: "[create|run|revert|generate] [name]"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
---

# Database Migration Management

Manage TypeORM migrations in `apps/api`.

**Action:** `$ARGUMENTS`

## Commands

### Create Empty Migration
```bash
cd apps/api
npm run typeorm:create-migration -- -n MigrationName
```
Then edit the file in `src/database/migrations/` to add SQL.

### Auto-generate from Entity Changes
After modifying entity files:
```bash
cd apps/api
npm run typeorm:generate-migration -- -n DescribeChanges
```

### Run Pending Migrations
```bash
cd apps/api
npm run typeorm:run-migration
```

### Revert Last Migration
```bash
cd apps/api
npm run typeorm:revert-migration
```

## Rules

- All table names MUST be prefixed with `notify_` (e.g., `notify_organizations`)
- Column names in SQL use snake_case (`organization_id`, `created_on`)
- Entity properties use camelCase (`organizationId`, `createdOn`)
- Primary keys follow `<entity>_id` pattern (`user_id`, `application_id`)
- Always include both `up()` and `down()` methods
- Test migrations locally before committing
- Never use `synchronize: true` in production
