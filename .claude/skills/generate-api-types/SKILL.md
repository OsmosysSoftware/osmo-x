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
2. Create type aliases in model files for cleaner usage:
   ```typescript
   // src/app/core/models/notification.model.ts
   import { components } from '../types/api.types';
   export type Notification = components['schemas']['NotificationResponseDto'];
   ```
3. Use snake_case field names directly — NO conversion to camelCase
4. Run `npm run lint` to verify no type errors
