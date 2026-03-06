# OsmoX API Implementation - Quick Reference

**TL;DR:** Apply these patterns to each new v1 module.

---

## What's Already Working

- Existing REST + GraphQL endpoints (backward compatible)
- Bull queue notification processing
- Provider chain fallback system

## What's New (v1 endpoints)

- All new endpoints under `/api/v1/` prefix
- RFC 7807 Problem JSON errors
- snake_case responses via interceptor
- Zalando-compliant pagination
- Org-scoped data access
- JWT refresh tokens

---

## Copy-Paste Template for v1 Controller

### 1. Service Method (Paginated + Org-Scoped)

```typescript
async findAllPaginated(
  organizationId: number,
  pagination: { limit: number; offset: number; sort?: string; order?: 'ASC' | 'DESC' },
): Promise<[YourEntity[], number]> {
  const order = pagination.sort
    ? { [pagination.sort]: pagination.order || 'ASC' }
    : { createdOn: 'DESC' };

  return this.repository.findAndCount({
    where: { organizationId },
    take: pagination.limit,
    skip: pagination.offset,
    order,
  });
}
```

### 2. Controller Endpoint

```typescript
import { Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgScopeGuard } from '../../common/guards/org-scope.guard';

@Get()
@UseGuards(JwtAuthGuard, OrgScopeGuard)
@ApiOperation({ summary: 'List resources' })
async findAll(
  @Query() query: PaginationQueryDto,
  @Req() request: Request,
): Promise<CollectionResponse<YourResponseDto>> {
  const { organizationId } = request.user;
  const { page, limit, offset, sort, order } = PaginationHelper.normalize(query);
  const [items, total] = await this.service.findAllPaginated(organizationId, { limit, offset, sort, order });
  const dtos = items.map(item => YourResponseDto.fromEntity(item));
  return PaginationHelper.buildResponse(dtos, request, page, limit, total);
}
```

---

## Response DTO Pattern

```typescript
export class YourResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Example Name' })
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  created_on: string;

  static fromEntity(entity: YourEntity): YourResponseDto {
    const dto = new YourResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.created_on = entity.createdOn?.toISOString();
    return dto;
  }
}
```

---

## Error Throwing Pattern

```typescript
import { NotFoundException } from '../../common/exceptions/not-found.exception';

async findOne(id: number, organizationId: number): Promise<YourEntity> {
  const entity = await this.repository.findOne({
    where: { id, organizationId },
  });

  if (!entity) {
    throw new NotFoundException('RESOURCE_NOT_FOUND', `Resource with ID '${id}' not found`);
  }

  return entity;
}
```

---

## Migration Checklist (Per Module)

- [ ] Create v1 controller (`*-v1.controller.ts`)
- [ ] Create response DTO with `fromEntity()` method
- [ ] Add pagination to list endpoints
- [ ] Add org-scoping to all queries
- [ ] Add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
- [ ] Add `@UseGuards(JwtAuthGuard, OrgScopeGuard)`
- [ ] Test with Swagger UI at `/api/docs`
- [ ] Verify snake_case in response

---

## Module Priority

1. **Auth** — Login, refresh, me (foundation for all others)
2. **Applications** — Core entity, needed by providers/chains
3. **Providers** — Depends on applications + master providers
4. **Provider Chains** — Depends on applications + providers
5. **Notifications** — Read-only views for portal
6. **Users** — Org admin management
7. **API Keys** — Nested under applications
8. **Webhooks** — Per-provider config
9. **Dashboard** — Aggregated stats

---

## Full Documentation

- **Error codes:** `docs/reference/ERROR_CODES.md`
- **Snake case details:** `docs/reference/SNAKE_CASE_CONSISTENCY.md`
- **Zalando compliance:** `docs/reference/ZALANDO_COMPLIANCE.md`
- **Coding standards:** `CLAUDE.md`
