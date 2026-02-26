# CLAUDE.md - OsmoX API Development Guidelines

---

## CRITICAL INSTRUCTIONS - MUST FOLLOW

### 1. ALWAYS Use Context7 MCP Server for Latest Documentation

- **Use Context7** to fetch the latest documentation for NestJS, TypeORM, Passport, Bull, PostgreSQL, etc.
- **Never rely on outdated knowledge** - Always fetch current docs before implementing
- **Library ID for NestJS:** `/nestjs/nest`
- **Example:** Before implementing JWT auth, use Context7 to get latest NestJS Passport + JWT patterns

**Why:** Ensures we use current best practices and avoid deprecated patterns

---

### 2. ALWAYS Use Serena MCP for Code Navigation & Editing

- **Use Serena's symbolic tools** (`find_symbol`, `get_symbols_overview`, `find_referencing_symbols`) for navigating and understanding code
- **Use Serena's editing tools** (`replace_symbol_body`, `insert_after_symbol`, `replace_content`) for precise code modifications
- **Use Serena's memory** (`write_memory`, `read_memory`, `list_memories`) to persist TODOs, architectural decisions, and cross-session context
- **Prefer Serena over reading full files** — use symbol-level reads to minimize token usage

**Why:** Token-efficient code exploration and reliable symbolic editing

---

### 3. ALWAYS Use NestJS CLI for Code Generation

- **Use `nest generate`** (or `nest g`) for all NestJS code generation
- **Never manually create** modules, controllers, services, guards, pipes, etc.
- **Available Commands:**

```bash
nest g module <name>           # Generate module
nest g controller <name>       # Generate controller
nest g service <name>          # Generate service
nest g guard <name>            # Generate guard
nest g interceptor <name>      # Generate interceptor
nest g pipe <name>             # Generate pipe
nest g decorator <name>        # Generate decorator
nest g class <name>            # Generate class (entities, DTOs)
```

**Why:** Ensures consistent structure, proper imports, and follows NestJS conventions

---

### 4. ALWAYS Update CLAUDE.md

- **After every architectural decision** - Document the pattern
- **After adding new modules** - Update project structure
- **After discovering new patterns** - Add to best practices
- **Keep as single source of truth** for this backend repository

---

### 5. ALWAYS Use NestJS Official Packages

- Use `@nestjs/swagger` - NOT `swagger-ui-express` directly
- Use `@nestjs/config` - For environment variables
- Use `@nestjs/jwt` + `@nestjs/passport` - For authentication
- Use `@nestjs/bull` - For job queues
- Use `@nestjs/typeorm` - For database operations
- Use `@nestjs/schedule` - For scheduled tasks

**Why:** Better integration, type safety, and follows NestJS ecosystem

---

## Project Overview

**Project Name:** OsmoX API
**Description:** Multi-tenant notification management system providing unified API for sending notifications across email, SMS, WhatsApp, push, and voice channels
**Architecture:** NestJS modular architecture with Bull queues for async processing
**Database:** PostgreSQL with TypeORM
**Authentication:** JWT with Passport (access + refresh tokens)
**Queue System:** Bull (Redis-backed) for notification processing

---

## Technology Stack

### Core Framework

- **NestJS** v11 - Progressive Node.js framework
- **Node.js** v20.x LTS
- **TypeScript** v5.8+ - Strict types
- **Express** v5 - HTTP server (via @nestjs/platform-express)

### Database

- **PostgreSQL** 18 - Primary database
- **TypeORM** v0.3 - ORM for database operations
- **Table prefix:** `notify_` for all tables

### Authentication & Security

- **@nestjs/jwt** - JWT token handling
- **@nestjs/passport** - Passport integration
- **passport-jwt** - JWT strategy
- **bcrypt** - Password hashing (10 rounds)

### Validation & Transformation

- **class-validator** - DTO validation with decorators
- **class-transformer** - Transform plain objects to class instances
- **@nestjs/swagger** - OpenAPI/Swagger integration with auto-generated schemas

### Queue & Background Jobs

- **@nestjs/bull** - Bull queue integration
- **bull** - Redis-backed job queue
- Separate queues per notification channel type (email, SMS, WhatsApp, etc.)

### Logging

- **nest-winston** - Winston logger integration (migrating to Pino)

### API Documentation

- **@nestjs/swagger** v11 - OpenAPI 3.1 spec generation
- Swagger UI at `/api`
- Snake_case response transformation for API consumers

---

## Project Structure

```text
apps/api/
├── src/
│   ├── common/                           # Shared utilities
│   │   ├── constants/                    # Constants (database, JWT interfaces)
│   │   ├── decorators/                   # Custom decorators
│   │   ├── dto/                          # Shared DTOs (pagination, responses)
│   │   ├── exceptions/                   # Custom exception hierarchy (RFC 7807)
│   │   ├── filters/                      # Exception filters
│   │   ├── guards/                       # Auth guards (JWT, API key, role, org-scope)
│   │   ├── interceptors/                 # Snake-case, correlation ID interceptors
│   │   ├── logger/                       # Logger middleware
│   │   └── utils/                        # Swagger transformer, pagination helper
│   ├── config/                           # Configuration
│   │   ├── database/                     # Database config
│   │   ├── typeorm/                      # TypeORM data source config
│   │   └── logger.config.ts             # Logger config
│   ├── database/                         # Database setup
│   │   ├── migrations/                   # TypeORM migrations
│   │   ├── database.module.ts
│   │   └── database-error.interceptor.ts
│   ├── jobs/                             # Bull queue jobs
│   │   ├── consumers/                    # Queue consumers per channel
│   │   └── producers/                    # Queue producers
│   ├── modules/                          # Feature modules
│   │   ├── applications/                 # Application management
│   │   ├── archived-notifications/       # Notification archival
│   │   ├── auth/                         # Authentication & JWT
│   │   ├── dashboard/                    # Dashboard stats (new, v1)
│   │   ├── master-providers/             # Provider type catalog
│   │   ├── notifications/                # Core notification processing
│   │   ├── organizations/                # Multi-tenancy (new)
│   │   ├── provider-chain-members/       # Chain member ordering
│   │   ├── provider-chains/              # Provider chain management
│   │   ├── providers/                    # Provider instances
│   │   ├── server-api-keys/              # API key authentication
│   │   ├── users/                        # User management
│   │   └── webhook/                      # Webhook configuration
│   ├── app.module.ts                     # Root module
│   └── main.ts                           # Application bootstrap
├── test/                                 # E2E tests
├── docs/                                 # Documentation
├── scheduler.sh                          # Notification processing scheduler
├── docker-compose.yml                    # Docker services
├── Dockerfile                            # Container build
├── nest-cli.json                         # NestJS CLI config
├── tsconfig.json                         # TypeScript config
├── .eslintrc.js                          # ESLint config
├── .prettierrc                           # Prettier config
└── package.json
```

---

## Development Commands

```bash
# Development
npm run start:dev           # Start with hot reload
npm run start:debug         # Start with debugging

# Building
npm run build               # Build for production

# Testing
npm test                    # Run unit tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report
npm run test:e2e            # End-to-end tests
npx jest --testPathPattern=<pattern>  # Run single test

# Code Quality
npm run lint                # ESLint with max-warnings=0
npm run lint:fix            # Auto-fix linting issues
npm run format              # Format with Prettier

# Database
npm run typeorm:create-migration    # Create empty migration
npm run typeorm:generate-migration  # Generate from entity changes
npm run typeorm:run-migration       # Run pending migrations
npm run typeorm:revert-migration    # Revert last migration
npm run database:reset              # Reset database

# Docker
docker compose up -d        # Start all services
docker compose ps           # Check service health
docker compose logs -f osmox-api  # Follow API logs

# Scheduler (required for notification processing)
./scheduler.sh
```

---

## Authentication & Security

### JWT Authentication Flow

1. User logs in → Auth service validates credentials
2. Auth service generates JWT access token + refresh token
3. Client stores tokens
4. Client sends access token in `Authorization: Bearer <token>` header
5. JWT strategy validates token and extracts user
6. User injected into request

### Token Types

- **Access Token:** Short-lived, used for API authentication
- **Refresh Token:** Long-lived, used only for token refresh

### Endpoints (v1)

- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Revoke refresh token
- `GET /api/v1/auth/me` - Current user profile

### Guards

- **JwtAuthGuard** - Validates access tokens
- **JwtRefreshGuard** - Validates refresh tokens
- **ApiKeyGuard** - Validates server API keys (for external notification senders)
- **RoleGuard** - Role-based access (ORG_USER, ORG_ADMIN, SUPER_ADMIN)
- **OrgScopeGuard** - Ensures resource belongs to user's organization

### Role System

```typescript
export const UserRoles = {
  ORG_USER: 0,      // Read within organization
  ORG_ADMIN: 1,     // Manage within organization
  SUPER_ADMIN: 2,   // Platform-level administration
};
```

---

## Database Patterns (TypeORM)

### Entity Structure

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'notify_table_name' })
export class EntityName {
  @PrimaryGeneratedColumn({ name: 'entity_id' })
  entityId: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updatedOn: Date;
}
```

### Naming Conventions

- **Table names:** `notify_` prefix, snake_case, plural (`notify_users`, `notify_applications`)
- **Column names:** snake_case (`organization_id`, `created_on`)
- **Entity properties:** camelCase (`organizationId`, `createdOn`)
- **Primary keys:** `<entity>_id` pattern (`user_id`, `application_id`)

### Migrations

- Always use migrations for schema changes, never `synchronize: true`
- Migration files in `src/database/migrations/`
- Run: `npm run typeorm:run-migration`
- Create: `npm run typeorm:create-migration`

### Entity Hierarchy

```text
Organization
├── User (organizationId, role: ORG_USER | ORG_ADMIN)
├── Application (organizationId)
│   ├── Provider (applicationId, channelType, configuration)
│   ├── ProviderChain (applicationId, providerType)
│   │   └── ProviderChainMember (priorityOrder)
│   ├── ServerApiKey (applicationId)
│   ├── Notification (applicationId, providerChainId)
│   └── ArchivedNotification (applicationId)
└── Webhook (providerId)

MasterProvider (read-only catalog of available provider types)
```

---

## API Design

### Endpoint Versioning

- **Existing endpoints:** Unchanged (backward compatible), use JSend response format
- **New endpoints:** Under `/api/v1/` prefix, use RFC 7807 error responses
- **Swagger docs:** Available at `/api`

### Response Format (v1 endpoints)

**Success:**

```json
{
  "items": [...],
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

**Error (RFC 7807):**

```json
{
  "type": "https://host/problems/not-found",
  "title": "Resource not found",
  "status": 404,
  "detail": "Application with ID 123 not found",
  "instance": "/api/v1/applications/123",
  "error_code": "APP_NOT_FOUND",
  "timestamp": "2026-02-25T10:00:00.000Z"
}
```

### Snake_case Convention

- All v1 API responses use **snake_case** field names
- `SnakeCaseInterceptor` transforms camelCase entity properties to snake_case
- `SwaggerSnakeCaseTransformer` transforms OpenAPI spec for accurate docs
- Request bodies are transformed from snake_case to camelCase automatically
- Frontend uses snake_case types directly (NO conversion)

#### Query Parameters

- NOT transformed by SnakeCaseInterceptor
- DTOs use `@Transform` decorator to map snake_case → camelCase
- Frontend always sends snake_case

```typescript
export class FilterDto {
  @ApiProperty({ name: 'channel_type' })
  @Transform(({ obj }) => obj.channel_type || obj.channelType)
  channelType?: string;
}
```

#### Request Bodies

- Transformed by SnakeCaseInterceptor (snake_case → camelCase)
- DTOs receive camelCase properties
- Use `name: 'snake_case'` in `@ApiProperty()` to document expected input format

```typescript
@ApiProperty({ name: 'test_mode_enabled' })
testModeEnabled?: boolean;
```

#### Responses

- Transformed by SnakeCaseInterceptor (camelCase → snake_case)
- Frontend receives snake_case

#### CRITICAL: Inline Response Schemas Must Use snake_case Manually

The `transformSwaggerToSnakeCase` utility only transforms schemas in `document.components.schemas` (DTOs defined with decorators). It does NOT transform inline schemas defined directly in `@ApiResponse()` decorators.

```typescript
// CORRECT
@ApiResponse({
  status: 200,
  schema: {
    type: 'object',
    properties: {
      total_items: { type: 'number' },        // snake_case
      channel_type: { type: 'string' },       // snake_case
    }
  }
})

// WRONG - will not be transformed
@ApiResponse({
  schema: { properties: { totalItems: { type: 'number' } } }  // camelCase - BAD
})
```

**Alternative:** Define response DTOs as separate classes and use `@ApiResponse({ type: ResponseDto })` to leverage automatic transformation.

### Controller Pattern (v1)

```typescript
@ApiTags('Applications')
@ApiBearerAuth()
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, OrgScopeGuard)
@UseInterceptors(SnakeCaseInterceptor)
export class ApplicationsV1Controller {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List applications' })
  @ApiResponse({ status: 200, type: PaginatedApplicationResponseDto })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedResponse<Application>> {
    return this.applicationsService.findAllByOrg(req.user.organizationId, query);
  }
}
```

### DTO Pattern

```typescript
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'My App', description: 'Application name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: false, description: 'Enable test mode' })
  @IsOptional()
  @IsBoolean()
  testModeEnabled?: boolean;
}
```

---

## Error Handling

### Custom Exception Hierarchy

```typescript
AppException (base)
├── AuthException (401)
├── NotFoundException (404)
├── ConflictException (409)
├── ValidationException (400)
└── ForbiddenException (403)
```

### Error Codes

Defined in `src/common/constants/error-codes.ts`. Format: `MODULE_ERROR_TYPE`

```typescript
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_UNAUTHORIZED
USER_NOT_FOUND
APP_NOT_FOUND
ORG_NOT_FOUND
PROVIDER_NOT_FOUND
NOTIFICATION_NOT_FOUND
VALIDATION_FAILED
GENERAL_INTERNAL_ERROR
```

### Usage

```typescript
throw new NotFoundException(
  ErrorCodes.APP_NOT_FOUND,
  `Application with ID ${id} not found`,
);
```

---

## Clean Architecture - Response DTOs

Following the interview-app reference implementation, **never return entities directly from controllers**. Always use Response DTOs.

### Why Response DTOs?

1. **Prevents data leakage** - Entities may contain sensitive fields
2. **Enables API evolution** - Change API structure without changing DB schema
3. **Improves OpenAPI documentation** - Swagger generates complete schemas
4. **Type safety** - Frontend gets accurate TypeScript types from OpenAPI spec
5. **Flexibility** - Different endpoints can return different views of the same entity

### Pattern

#### 1. Create Response DTO (`dto/*-response.dto.ts`)

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicationResponseDto {
  @ApiProperty({ description: 'Application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Application name', example: 'My App' })
  name: string;

  @ApiProperty({ description: 'Test mode enabled', example: false })
  testModeEnabled: boolean;

  @ApiPropertyOptional({ description: 'Organization ID', example: 1 })
  organizationId?: number;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdOn: string;  // ISO 8601 string, not Date object

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedOn: string;
}
```

#### 2. Add Mapping Method in Service

```typescript
@Injectable()
export class ApplicationsService {
  private mapToDto(app: Application): ApplicationResponseDto {
    return {
      applicationId: app.applicationId,
      name: app.name,
      testModeEnabled: app.testModeEnabled,
      organizationId: app.organizationId,
      createdOn: app.createdOn.toISOString(),
      updatedOn: app.updatedOn.toISOString(),
    };
  }

  async findOne(id: number): Promise<ApplicationResponseDto> {
    const app = await this.repo.findOne({ where: { applicationId: id } });
    if (!app) throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, `Application with ID ${id} not found`);
    return this.mapToDto(app);
  }

  // Internal method when entity instance needed
  async findOneEntity(id: number): Promise<Application> {
    const app = await this.repo.findOne({ where: { applicationId: id } });
    if (!app) throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, `Application with ID ${id} not found`);
    return app;
  }
}
```

#### 3. Update Controller with @ApiExtraModels

```typescript
@ApiTags('Applications')
@ApiExtraModels(ApplicationResponseDto)
@Controller('api/v1/applications')
export class ApplicationsV1Controller {
  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id') id: number) {
    return this.applicationsService.findOne(id);
  }
}
```

### Nested DTOs

For entities with relationships, create nested DTOs:

```typescript
export class ProviderInChainDto {
  @ApiProperty() providerId: number;
  @ApiProperty() name: string;
  @ApiProperty() channelType: string;
}

export class ProviderChainResponseDto {
  @ApiProperty() providerChainId: number;
  @ApiProperty({ type: [ProviderInChainDto] })
  members: ProviderInChainDto[];
}
```

### Implementation Checklist

When adding Response DTOs to a module:

- [ ] Create Response DTO (`dto/*-response.dto.ts`) with `@ApiProperty()` on all fields
- [ ] Create Nested DTOs for relationships
- [ ] Add `mapToDto()` method (private) in service
- [ ] Update service return types to DTOs
- [ ] Add `findOneEntity()` for internal operations
- [ ] Register with `@ApiExtraModels` on controller
- [ ] Add `type:` to `@ApiResponse` decorators
- [ ] Verify Swagger schema is complete (not empty)

---

## Pagination Pattern

### Collection Response Format

All collection endpoints return pagination with links:

```json
{
  "items": [...],
  "self": "https://host/api/v1/applications?page=1&limit=20",
  "first": "https://host/api/v1/applications?page=1&limit=20",
  "next": "https://host/api/v1/applications?page=2&limit=20",
  "prev": null,
  "last": "https://host/api/v1/applications?page=5&limit=20",
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

### Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Field to sort by (e.g., `created_on`)
- `order` - Sort order: `asc` or `desc`

### Service Pattern

```typescript
async findAllPaginated(
  orgId: number,
  pagination: { limit: number; offset: number; sort?: { field: string; order: 'asc' | 'desc' } },
): Promise<[ApplicationResponseDto[], number]> {
  const order = pagination.sort
    ? { [pagination.sort.field]: pagination.sort.order.toUpperCase() as 'ASC' | 'DESC' }
    : { createdOn: 'DESC' as const };

  const [items, total] = await this.repo.findAndCount({
    where: { organizationId: orgId },
    take: pagination.limit,
    skip: pagination.offset,
    order,
  });

  return [items.map(item => this.mapToDto(item)), total];
}
```

### Controller Pattern

```typescript
@Get()
@ApiOperation({ summary: 'List applications' })
@ApiCollectionResponse(ApplicationResponseDto)
async findAll(
  @Query() pagination: PaginationDto,
  @Req() request: Request,
): Promise<CollectionResponse<ApplicationResponseDto>> {
  const { page, limit, offset, sort } = PaginationHelper.normalizePaginationParams(pagination);
  const [items, total] = await this.service.findAllPaginated(req.user.organizationId, { limit, offset, sort });
  const pageMeta = PaginationHelper.buildPaginationMeta(page, limit, total);
  const { protocol, host } = LinkBuilder.extractBaseUrl(request);
  const links = LinkBuilder.buildCollectionLinks(protocol, host, '/api/v1/applications', pageMeta);
  return new CollectionResponse(items, links.self, links.first, links.last, pageMeta, links.next, links.prev);
}
```

---

## Global Setup (main.ts)

```typescript
// Applied globally for v1 endpoints:
app.useGlobalFilters(new ProblemJsonFilter());              // RFC 7807 errors
app.useGlobalInterceptors(
  new CorrelationIdInterceptor(),                           // X-Correlation-ID
  new SnakeCaseInterceptor(),                               // camelCase ↔ snake_case
);
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));

// Swagger
const document = transformSwaggerToSnakeCase(swaggerDoc);
SwaggerModule.setup('api', app, document);
```

---

## Queue System (Bull)

### Architecture

- Separate queues per notification channel (email, SMS, WhatsApp, push, voice)
- Producers enqueue notification IDs, consumers process them
- Redis-backed for persistence and reliability

### Processing Flow

1. Client creates notification via API
2. Notification saved to DB with `Pending` status
3. `scheduler.sh` periodically calls queue endpoints
4. Bull consumers pick up jobs and invoke provider services
5. Status updated: `In Progress` → `Awaiting Confirmation` → `Success`/`Failed`
6. Completed notifications archived to `notify_archived_notifications`

### Provider Chains

Provider chains define fallback sequences. If primary provider fails, next provider in chain is tried automatically based on `priorityOrder`.

---

## Infrastructure

### Docker Compose

Single `docker-compose.yml` runs all services:

- `osmox-postgres` - PostgreSQL 18 with healthcheck
- `osmox-redis` - Redis 7 with AOF persistence
- `osmox-api` - NestJS application
- `osmox-dozzle` - Log viewer web UI

### Environment Variables

See `.env.example` for all configuration options. Key variables:

- `SERVER_PORT` - API server port (default: 3000)
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `DB_*` - Database connection settings
- `REDIS_*` - Redis connection settings
- `COMPOSE_PROJECT_NAME` - Docker project name
- `ADMIN_USER` / `ADMIN_PASSWORD` - Dozzle log viewer credentials

---

## Code Style

### Prettier

- Print width: 100
- Single quotes
- Trailing commas: all
- Tab width: 2
- Semicolons: required

### ESLint

- `@typescript-eslint/explicit-function-return-type`: error (with allowExpressions)
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unused-vars`: error
- `padding-line-between-statements`: Blank lines before/after block-like statements
- `max-warnings=0` - Zero warnings tolerance

### Naming Conventions

- **Classes:** PascalCase (`AuthService`, `UserEntity`)
- **Variables/methods:** camelCase (`getUserById`, `isActive`)
- **Files/directories:** kebab-case (`auth.service.ts`, `user-profile/`)
- **Environment variables:** UPPERCASE (`JWT_SECRET`, `DB_HOST`)
- **Constants:** UPPER_SNAKE_CASE or PascalCase (`UserRoles`, `MAX_RETRY_COUNT`)

---

## Git Commit Standards

- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`
- Example: `feat: add organization module with CRUD endpoints`
- Keep commits clean - no promotional or attribution content

---

## Testing

- **Framework:** Jest
- **Test files:** `*.spec.ts` alongside source files
- **E2E tests:** `test/` directory
- **Run single:** `npx jest --testPathPattern=auth`
- **Coverage:** `npm run test:cov`
- **Convention:** Arrange-Act-Assert

---

## Documentation

### Technical Reference (this repo)

| Document | Description | Location |
|----------|-------------|----------|
| **[CLAUDE.md](./CLAUDE.md)** | Development guidelines, coding standards | Root |
| **[Error Codes](./docs/reference/ERROR_CODES.md)** | Complete API error codes reference | `docs/reference/` |
| **[Zalando Compliance](./docs/reference/ZALANDO_COMPLIANCE.md)** | API design compliance status | `docs/reference/` |
| **[Implementation Summary](./docs/reference/IMPLEMENTATION_SUMMARY.md)** | v1 API architecture overview | `docs/reference/` |
| **[Quick Reference](./docs/reference/QUICK_REFERENCE.md)** | Copy-paste code templates | `docs/reference/` |
| **[Snake Case Consistency](./docs/reference/SNAKE_CASE_CONSISTENCY.md)** | snake_case convention details | `docs/reference/` |

### Existing Docs

| Document | Description | Location |
|----------|-------------|----------|
| **[Development Setup](./docs/development-setup.md)** | Local setup guide | `docs/` |
| **[Production Setup](./docs/production-setup.md)** | Production deployment | `docs/` |
| **[Usage Guide](./docs/usage-guide.md)** | API usage examples | `docs/` |
| **[Database Design](./docs/database-design.md)** | Complete database schema | `docs/` |
| **[Block Diagram](./docs/block-diagram.md)** | System architecture | `docs/` |
| **[Add New Provider](./docs/add-new-provider.md)** | Guide for adding providers | `docs/` |
| **[API Documentation](./docs/api-documentation.md)** | API endpoint reference | `docs/` |
| **[Webhook Guide](./docs/webhook-guide.md)** | Webhook configuration | `docs/` |
| **[Test Mode Guide](./docs/test-mode-guide.md)** | Test mode usage | `docs/` |
| **[Docker Compose Usage](./docs/docker-compose-usage.md)** | Docker setup guide | `docs/` |

### LLM Reference

- **[llms.txt](./llms.txt)** — NestJS, TypeORM, Bull, PostgreSQL documentation links for LLM context

---

## Reference Implementation

The interview-app at `~/work/osmosys/interview-app/` defines our coding standards. When implementing new patterns, check:

- **Backend patterns:** `~/work/osmosys/interview-app/interview-app-backend/`
  - `CLAUDE.md` — Comprehensive backend guidelines
  - `src/common/interceptors/snake-case.interceptor.ts` — SnakeCaseInterceptor (adapt MikroORM → TypeORM)
  - `src/common/exceptions/` — Custom exception hierarchy
  - `src/common/filters/http-exception.filter.ts` — RFC 7807 Problem JSON filter
  - `src/common/constants/error-codes.ts` — Error code catalog
  - `src/common/utils/pagination.helper.ts` — Pagination helpers
  - `src/common/dto/collection-response.dto.ts` — Zalando collection response
  - `src/common/logging/pino.config.ts` — Pino structured logging
  - `src/common/interceptors/correlation-id.interceptor.ts` — Correlation ID
  - `docker-compose.yml` — Docker services with Dozzle
- **Frontend patterns:** `~/work/osmosys/interview-app/interview-app-frontend/`
  - `CLAUDE.md` — Angular 20 guidelines
  - `src/app/core/interceptors/` — Auth and error interceptors
  - `src/app/core/services/auth.service.ts` — Signal-based auth

Adapt patterns for OsmoX (TypeORM instead of MikroORM, notification domain instead of interview domain).
