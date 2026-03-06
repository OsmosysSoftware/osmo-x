# OsmoX v1 API - Implementation Summary

**Date:** 2025-02-25
**Status:** Planning complete, implementation pending

---

## Architecture Overview

OsmoX is being transformed from single-tenant to multi-tenant SaaS. The v1 API adds:

1. **Organization hierarchy** — Super Admin → Organization → Org Admin/Users
2. **REST endpoints** — All new endpoints under `/api/v1/`
3. **JWT refresh tokens** — Access + refresh token pair
4. **Org-scoped data** — All queries filtered by organization
5. **RFC 7807 errors** — Standardized error responses
6. **snake_case API** — Consistent naming convention
7. **Zalando pagination** — Offset-based with navigation links

---

## Backward Compatibility

| Aspect | Existing (unchanged) | New v1 |
|--------|---------------------|--------|
| **Prefix** | `/notifications`, `/graphql` | `/api/v1/*` |
| **Auth** | JWT access token only | JWT access + refresh tokens |
| **Errors** | JSend format | RFC 7807 Problem JSON |
| **Response case** | camelCase | snake_case |
| **Pagination** | None / custom | Zalando-compliant |
| **Data scoping** | Global | Per-organization |

Existing endpoints remain untouched for backward compatibility. External notification senders using API keys continue to work.

---

## Role System

| Role | Value | Scope | Capabilities |
|------|-------|-------|-------------|
| `ORG_USER` | 0 | Within org | Read notifications, view dashboards |
| `ORG_ADMIN` | 1 | Within org | Manage apps, providers, users, API keys |
| `SUPER_ADMIN` | 2 | Platform-wide | Manage organizations, system config |

Backward compatible: existing `BASIC(0)` → `ORG_USER(0)`, `ADMIN(1)` → `ORG_ADMIN(1)`.

---

## New Endpoints

### Authentication
```
POST   /api/v1/auth/login          → { access_token, refresh_token, user, expires_in }
POST   /api/v1/auth/refresh         → { access_token, refresh_token, expires_in }
POST   /api/v1/auth/logout          → Revoke refresh token
GET    /api/v1/auth/me              → Current user profile
```

### Applications
```
GET    /api/v1/applications         → Paginated list (org-scoped)
GET    /api/v1/applications/:id     → Single application
POST   /api/v1/applications         → Create application
PATCH  /api/v1/applications/:id     → Update application
DELETE /api/v1/applications/:id     → Delete application
```

### Providers
```
GET    /api/v1/providers            → Paginated list (org-scoped)
GET    /api/v1/providers/:id        → Single provider
POST   /api/v1/providers            → Create provider
PATCH  /api/v1/providers/:id        → Update provider
DELETE /api/v1/providers/:id        → Delete provider
```

### Master Providers (read-only catalog)
```
GET    /api/v1/master-providers     → All available provider types
GET    /api/v1/master-providers/:id → Single master provider with config schema
```

### Provider Chains
```
GET    /api/v1/provider-chains      → Paginated list (org-scoped)
POST   /api/v1/provider-chains      → Create chain with members
PATCH  /api/v1/provider-chains/:id  → Update chain
DELETE /api/v1/provider-chains/:id  → Delete chain
```

### Notifications
```
GET    /api/v1/notifications        → Paginated list (org-scoped, filterable)
GET    /api/v1/notifications/:id    → Single notification with full data
```

### Archived Notifications
```
GET    /api/v1/archived-notifications       → Paginated list (org-scoped)
GET    /api/v1/archived-notifications/:id   → Single archived notification
```

### Users (Org Admin)
```
GET    /api/v1/users                → List org users
POST   /api/v1/users                → Create user in org
PATCH  /api/v1/users/:id            → Update user
DELETE /api/v1/users/:id            → Delete user
```

### API Keys
```
GET    /api/v1/api-keys             → List keys (org-scoped)
POST   /api/v1/api-keys             → Generate new key
DELETE /api/v1/api-keys/:id         → Revoke key
```

### Webhooks
```
GET    /api/v1/webhooks             → List webhooks (org-scoped)
POST   /api/v1/webhooks             → Create webhook
PATCH  /api/v1/webhooks/:id         → Update webhook
DELETE /api/v1/webhooks/:id         → Delete webhook
```

### Dashboard
```
GET    /api/v1/dashboard/stats      → Aggregated notification stats for current org
```

### Organizations (Super Admin only)
```
GET    /api/v1/organizations        → List all organizations
POST   /api/v1/organizations        → Create organization
PATCH  /api/v1/organizations/:id    → Update organization
```

---

## Database Changes

### New Table: `notify_organizations`

```sql
CREATE TABLE notify_organizations (
  organization_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status SMALLINT NOT NULL DEFAULT 1
);
```

### Modified Tables

- `notify_users` — Added `organization_id INT NOT NULL`, `email VARCHAR(255)`
- `notify_applications` — Added `organization_id INT NOT NULL`

### Migration Strategy

1. Create `notify_organizations` table
2. Insert default organization
3. Add `organization_id` columns (nullable)
4. Backfill with default org ID
5. Add `NOT NULL` constraint
6. Add foreign key constraints

---

## File Structure (New Files)

```
apps/api/src/
├── common/
│   ├── constants/
│   │   └── error-codes.ts          # Error code catalog
│   ├── exceptions/
│   │   ├── app.exception.ts        # Base exception
│   │   ├── auth.exception.ts
│   │   ├── not-found.exception.ts
│   │   ├── conflict.exception.ts
│   │   └── validation.exception.ts
│   ├── filters/
│   │   └── problem-json.filter.ts  # RFC 7807 filter
│   ├── guards/
│   │   ├── super-admin.guard.ts
│   │   ├── org-admin.guard.ts
│   │   └── org-scope.guard.ts
│   ├── interceptors/
│   │   ├── snake-case.interceptor.ts
│   │   └── correlation-id.interceptor.ts
│   ├── dto/
│   │   ├── pagination-query.dto.ts
│   │   └── paginated-response.dto.ts
│   └── utils/
│       └── pagination.helper.ts
├── modules/
│   ├── organizations/              # New module
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── organizations.module.ts
│   │   ├── organizations.service.ts
│   │   └── organizations.controller.ts
│   ├── auth/
│   │   ├── auth-v1.controller.ts   # New REST controller
│   │   ├── dto/auth-response.dto.ts
│   │   └── strategies/jwt-refresh.strategy.ts
│   └── dashboard/                  # New module
│       ├── dashboard.module.ts
│       ├── dashboard.service.ts
│       └── dashboard.controller.ts
└── database/
    └── migrations/
        └── TIMESTAMP-AddOrganization.ts
```

---

## References

- **Plan:** `~/.claude/plans/sleepy-sauteeing-teacup.md`
- **Error Codes:** `docs/reference/ERROR_CODES.md`
- **Snake Case:** `docs/reference/SNAKE_CASE_CONSISTENCY.md`
- **Zalando Compliance:** `docs/reference/ZALANDO_COMPLIANCE.md`
- **Quick Reference:** `docs/reference/QUICK_REFERENCE.md`
