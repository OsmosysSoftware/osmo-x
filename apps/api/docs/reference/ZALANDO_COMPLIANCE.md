# Zalando RESTful API Guidelines - Implementation Status

**Last Updated:** 2025-02-25
**Status:** Infrastructure planned for v1 endpoints
**Applies to:** All new `/api/v1/*` endpoints

---

## Compliance Checklist

### Compliant Areas (planned for v1)

| Rule | Status | Implementation |
|------|--------|----------------|
| **snake_case for JSON** | Planned | SnakeCaseInterceptor on v1 controllers |
| **snake_case for query params** | Planned | @Transform in DTOs |
| **kebab-case for URLs** | Existing | Already using `/provider-chains`, `/server-api-keys` |
| **RFC 7807 errors** | Planned | ProblemJsonFilter on v1 controllers |
| **Full absolute URIs** | Planned | LinkBuilder with protocol + host |
| **HTTP methods** | Existing | Correct usage throughout |
| **HTTP status codes** | Existing | Proper codes |
| **JSON objects at top-level** | Existing | All responses wrapped |
| **ISO 8601 dates** | Existing | TypeORM Date fields serialize to ISO |

### Documented Deviations

| Rule | Zalando Says | We Use | Rationale |
|------|--------------|--------|-----------|
| **Pagination** | Cursor-based | Offset-based | Better UX (page numbers), sufficient for notification volumes |
| **IDs** | UUIDs | Auto-increment integers | Existing schema, backward compatibility |
| **API prefix** | Avoid `/api` | Using `/api/v1` | Versioning + industry convention |

---

## Pagination Format

All v1 collection endpoints return:

```json
{
  "items": [...],
  "self": "http://localhost:3000/api/v1/applications?page=1&limit=20",
  "first": "http://localhost:3000/api/v1/applications?page=1&limit=20",
  "next": "http://localhost:3000/api/v1/applications?page=2&limit=20",
  "prev": null,
  "last": "http://localhost:3000/api/v1/applications?page=5&limit=20",
  "page_info": {
    "page": 1,
    "limit": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)
- `sort` — Field to sort by (e.g., `created_on`)
- `order` — Sort order: `asc` or `desc`

---

## RFC 7807 Problem JSON Format

```json
{
  "type": "https://api.osmox.dev/problems/notification-not-found",
  "title": "Notification Not Found",
  "status": 404,
  "detail": "Notification with ID '123' not found",
  "instance": "/api/v1/notifications/123",
  "error_code": "NOTIFICATION_NOT_FOUND",
  "timestamp": "2025-02-25T12:00:00.000Z"
}
```

**Content-Type:** `application/problem+json`

---

## Implementation Plan

### Phase 1: Infrastructure
- [ ] Create `SnakeCaseInterceptor` (adapt from interview-app, replace MikroORM with TypeORM checks)
- [ ] Create `ProblemJsonFilter` (RFC 7807 exception filter)
- [ ] Create custom exceptions (`AppException`, `NotFoundException`, etc.)
- [ ] Create error codes catalog (`error-codes.ts`)
- [ ] Create `PaginationHelper` and `CollectionResponse` DTO
- [ ] Create `CorrelationIdInterceptor`

### Phase 2: Auth + Core Modules
- [ ] `POST /api/v1/auth/login` — JWT with refresh tokens
- [ ] `POST /api/v1/auth/refresh` — Token refresh
- [ ] `GET /api/v1/auth/me` — Current user profile
- [ ] `GET /api/v1/applications` — Paginated, org-scoped
- [ ] `GET /api/v1/providers` — Paginated, org-scoped

### Phase 3: All Remaining Modules
- [ ] Provider chains + members
- [ ] Notifications + archived notifications
- [ ] Users management
- [ ] API keys
- [ ] Webhooks
- [ ] Dashboard stats

---

## References

- **Zalando Guidelines:** https://opensource.zalando.com/restful-api-guidelines/
- **RFC 7807 Problem JSON:** https://datatracker.ietf.org/doc/html/rfc7807
- **Error Codes:** `docs/reference/ERROR_CODES.md`
- **Snake Case Details:** `docs/reference/SNAKE_CASE_CONSISTENCY.md`
