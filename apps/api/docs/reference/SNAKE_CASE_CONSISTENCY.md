# Snake Case Consistency

**Status:** To be implemented for v1 endpoints
**Applies to:** All `/api/v1/*` endpoints only (existing endpoints unchanged)

---

## The Pattern

### External API (snake_case)
```
Request Query Params:  snake_case (no transformation)
Request Body:          snake_case → camelCase (interceptor)
Response:              camelCase → snake_case (interceptor)
```

### Internal Code (camelCase)
- TypeScript properties: `camelCase`
- Entity columns: `camelCase` (TypeORM maps to snake_case DB columns)
- DTOs: `camelCase` internally, `snake_case` externally via interceptor

---

## How It Works

### SnakeCaseInterceptor (v1 only)

Applied to v1 controllers only (not existing endpoints):

```typescript
@Controller('api/v1/applications')
@UseInterceptors(SnakeCaseInterceptor)
export class ApplicationsV1Controller { }
```

**What it does:**
- Transforms response body keys: `camelCase` → `snake_case`
- Transforms request body keys: `snake_case` → `camelCase`
- Does NOT transform query parameters (they stay as-is)

### Query Parameter DTOs

Query params use `@Transform` decorator to map snake_case to camelCase:

```typescript
export class FilterDto {
  @ApiProperty({ name: 'application_id', required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ obj }) => obj.application_id || obj.applicationId)
  applicationId?: number;
}
```

### Swagger Inline Schemas

**Warning:** Inline `@ApiResponse` schemas are NOT auto-transformed. Use snake_case manually:

```typescript
// WRONG - will show camelCase in Swagger
@ApiResponse({
  schema: {
    properties: {
      accessToken: { type: 'string' },  // ❌
    }
  }
})

// CORRECT - manually use snake_case
@ApiResponse({
  schema: {
    properties: {
      access_token: { type: 'string' },  // ✅
    }
  }
})
```

---

## Response DTO Pattern

Response DTOs should use snake_case property names since they represent the external API:

```typescript
export class ApplicationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My App' })
  name: string;

  @ApiProperty({ example: false })
  is_test_mode: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  created_on: string;

  static fromEntity(entity: Application): ApplicationResponseDto {
    const dto = new ApplicationResponseDto();
    dto.id = entity.applicationId;
    dto.name = entity.name;
    dto.is_test_mode = entity.isTestMode;
    dto.created_on = entity.createdOn?.toISOString();
    return dto;
  }
}
```

---

## Frontend Consumption

Frontend uses snake_case everywhere — no transformation needed:

```typescript
// Generated types from OpenAPI will have snake_case
interface Application {
  id: number;
  name: string;
  is_test_mode: boolean;
  created_on: string;
}

// Query params are snake_case
const response = await api.get('/api/v1/applications', {
  params: {
    application_id: 123,
    page: 1,
    limit: 20,
  }
});
```

---

## Summary

| Layer | Convention | Example |
|-------|-----------|---------|
| Database columns | snake_case | `application_id`, `created_on` |
| TypeORM entities | camelCase | `applicationId`, `createdOn` |
| Internal services | camelCase | `findByApplicationId()` |
| API request body | snake_case | `{ "application_id": 1 }` |
| API response body | snake_case | `{ "created_on": "..." }` |
| API query params | snake_case | `?application_id=1` |
| Response DTOs | snake_case | `@ApiProperty() application_id` |
