---
name: generate-api-types
description: Regenerate TypeScript types from the backend OpenAPI spec for the portal. Use after adding or changing backend API endpoints, DTOs, or response shapes.
allowed-tools: Bash, Read
---

# Generate API Types from Backend OpenAPI Spec

Regenerates `apps/portal/src/app/core/types/api.types.ts` from the running backend's Swagger spec.

## Prerequisites

The API server must be running at `http://localhost:3000`.

```bash
cd apps/api && npm run start:dev
```

Wait for the server to start, then verify Swagger is accessible:
```bash
curl -s http://localhost:3000/api/docs-json | head -1
```

## Generate Types

```bash
cd apps/portal
npm run generate:api
```

This runs `openapi-typescript http://localhost:3000/api/docs-json -o src/app/core/types/api.types.ts`.

## After Generation

1. **NEVER manually edit** the generated `api.types.ts` file
2. Add or update type aliases in `src/app/core/models/api.model.ts`:
   ```typescript
   import { components } from '../types/api.types';
   export type Notification = components['schemas']['NotificationResponseDto'];
   export type CreateApplicationInput = components['schemas']['CreateApplicationInput'];
   ```
3. All services and components import from `api.model.ts` — NOT directly from `api.types.ts`
4. Use snake_case field names directly — NO conversion to camelCase
5. Run `npx ng build` to verify no type errors
6. If new fields were added, check if any components need updating (e.g., new columns in tables)
