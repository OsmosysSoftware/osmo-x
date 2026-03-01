# CLAUDE.md - OsmoX Portal

## CRITICAL INSTRUCTIONS - MUST FOLLOW

### 1. ALWAYS Use MCP Servers for Latest Documentation

- **Use PrimeNG MCP** (`@primeng/mcp`) for PrimeNG v20 component docs — props, events, templates, methods, theming, and pass through styling
- **Use Context7** to fetch the latest documentation for Angular, Tailwind CSS, and other libraries
- **Never rely on outdated knowledge** — always fetch current docs before implementing

### 2. ALWAYS Update CLAUDE.md

- **After every architectural decision** — document the pattern
- **After adding new features** — update project structure
- **After discovering new patterns** — add to best practices
- **Keep as single source of truth** for this portal repository

---

## Project Overview

OsmoX Portal is an Angular 20 application for managing the OsmoX multi-tenant notification platform. Provides CRUD management for organizations, applications, providers, provider chains, notifications, users, API keys, and webhooks with role-based access control.

## Development Commands

```bash
npm start              # Dev server at localhost:4200
npm run build:prod     # Production build
npm test               # Unit tests (Karma/Jasmine)
npm run lint           # ESLint (--max-warnings=0)
npm run lint:fix       # Auto-fix
npm run lint-fix-format # Combined: format + lint + format
npm run generate:api   # Regenerate TypeScript types from backend OpenAPI spec
```

`npm run generate:api` runs `openapi-typescript` against `http://localhost:3000/api/docs-json` and outputs to `src/app/core/types/api.types.ts`.

---

## Architecture

### Tech Stack

- **Angular 20** — zoneless change detection (NO Zone.js), signals, standalone components
- **PrimeNG v20** — UI component library (Aura theme)
- **PrimeIcons** — icon library from PrimeNG
- **Tailwind CSS v4** — utility-first CSS with tailwindcss-primeui plugin
- **TypeScript** — strict mode, no explicit any
- **ESLint + Prettier** — code quality and formatting

### Folder Structure

```text
src/app/
├── core/                          # Singleton services, guards, interceptors
│   ├── constants/
│   │   ├── notification.ts        # Delivery status, channel type constants
│   │   └── roles.ts               # UserRoles enum and labels
│   ├── guards/
│   │   ├── auth.guard.ts          # Functional auth guard
│   │   └── role.guard.ts          # orgAdminGuard, superAdminGuard
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # JWT injection + 401 refresh
│   │   ├── org-context.interceptor.ts  # SUPER_ADMIN org context injection
│   │   └── error.interceptor.ts   # Global error toast
│   ├── models/
│   │   ├── api.model.ts           # API entity interfaces (snake_case)
│   │   └── auth.model.ts          # User, LoginDto, JwtPayload, AuthResponse
│   ├── services/
│   │   ├── auth.service.ts        # Signal-based auth, token management, role checks
│   │   └── org-context.service.ts # SUPER_ADMIN org selection with sessionStorage
│   └── types/
│       └── api.types.ts           # Auto-generated OpenAPI types (DO NOT EDIT)
├── features/                      # Feature modules (lazy-loaded)
│   ├── api-keys/
│   │   ├── pages/api-keys-list.ts
│   │   └── services/api-keys.service.ts
│   ├── applications/
│   │   ├── pages/applications-list.ts
│   │   └── services/applications.service.ts
│   ├── archived-notifications/
│   │   ├── pages/archived-list.ts
│   │   └── services/archived-notifications.service.ts
│   ├── notifications/
│   │   ├── pages/notifications-list.ts
│   │   └── services/notifications.service.ts
│   ├── provider-chains/
│   │   ├── pages/chains-list.ts
│   │   └── services/provider-chains.service.ts
│   ├── providers/
│   │   ├── pages/providers-list.ts
│   │   └── services/providers.service.ts
│   ├── super-admin/
│   │   ├── pages/organizations-list.ts
│   │   └── services/organizations.service.ts
│   ├── users/
│   │   ├── pages/users-list.ts
│   │   └── services/users.service.ts
│   └── webhooks/
│       ├── pages/webhooks-list.ts
│       └── services/webhooks.service.ts
├── shared/
│   ├── components/
│   │   ├── confirm-dialog/confirm-dialog.ts
│   │   ├── logo/logo.ts
│   │   ├── org-selector/org-selector.ts
│   │   ├── pagination/pagination.ts
│   │   └── status-badge/status-badge.ts
│   ├── directives/
│   ├── pipes/
│   │   ├── delivery-status.pipe.ts
│   │   └── channel-type.pipe.ts
│   └── utils/
├── layout/                        # App shell (Sakai-based)
│   ├── component/
│   │   ├── app.layout.ts          # Main layout wrapper
│   │   ├── app.topbar.ts          # Header with org selector, theme, profile
│   │   ├── app.sidebar.ts         # Side navigation
│   │   ├── app.menu.ts            # Menu list
│   │   ├── app.menuitem.ts        # Menu item
│   │   ├── app.footer.ts          # Footer
│   │   └── app.configurator.ts    # Theme configurator
│   └── service/layout.service.ts
├── pages/                         # Non-feature pages
│   ├── auth/
│   │   ├── login/login.ts
│   │   ├── access.ts
│   │   ├── error.ts
│   │   └── auth.routes.ts
│   ├── dashboard/dashboard.ts
│   └── notfound/notfound.ts
├── app.config.ts                  # Application config (providers, interceptors)
├── app.routes.ts                  # Route definitions with guards
└── app.ts                         # Root component
```

### File Naming Convention

- **Components**: `kebab-case.ts` (e.g., `users-list.ts`, `status-badge.ts`)
- **Layout components**: `app.name.ts` (e.g., `app.topbar.ts`, `app.layout.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `auth.service.ts`)
- **Guards**: `kebab-case.guard.ts` (e.g., `role.guard.ts`)
- **Interceptors**: `kebab-case.interceptor.ts` (e.g., `org-context.interceptor.ts`)
- **Pipes**: `kebab-case.pipe.ts` (e.g., `delivery-status.pipe.ts`)
- **Models**: `kebab-case.model.ts` (e.g., `api.model.ts`)

---

## CRITICAL: Zoneless Architecture

**IMPORTANT**: This application uses Angular's zoneless mode with signals. Always ensure zoneless compatibility.

### Zoneless Requirements (MANDATORY)

1. **NO Zone.js**: This app does NOT use Zone.js for change detection
2. **Signals for State**: ALL component state MUST use signals, not plain properties
3. **Signal Updates**: Use `.set()`, `.update()` — NEVER direct assignment
4. **Two-Way Binding**:
   - NEVER use `[(ngModel)]="signal().property"`
   - ALWAYS use `[ngModel]="signal().property" (ngModelChange)="updateMethod($event)"`
   - Create update methods that call `signal.update()`
5. **Change Detection**: Use `ChangeDetectionStrategy.OnPush` (MANDATORY)
6. **Computed Values**: Use `computed()` for derived state
7. **Async Operations**: Wrap in signal updates to trigger change detection

### Zoneless Pattern Example

```typescript
// CORRECT - Signals with proper updates
readonly settings = signal<Settings>({ value: 0 });

updateValue(newValue: number): void {
  this.settings.update(s => ({ ...s, value: newValue }));
}

// In template:
// [ngModel]="settings().value" (ngModelChange)="updateValue($event)"

// WRONG - Direct property binding
// [(ngModel)]="settings().value"  // Will NOT work in zoneless!
```

---

## Critical Angular 20 Patterns

### Component Structure (REQUIRED)

```typescript
import { Component, signal, computed, input, output, ChangeDetectionStrategy, inject } from '@angular/core';

@Component({
  selector: 'app-example',
  imports: [CommonModule, ButtonModule],             // Standalone component imports
  changeDetection: ChangeDetectionStrategy.OnPush,   // MANDATORY
  template: `...`,
})
export class ExampleComponent {
  // ALWAYS use input() function (NOT @Input decorator)
  readonly title = input.required<string>();
  readonly count = input<number>(0);

  // ALWAYS use output() function (NOT @Output decorator)
  readonly valueChange = output<number>();

  // ALWAYS use signals for state
  readonly counter = signal(0);
  readonly items = signal<string[]>([]);

  // Use computed() for derived state
  readonly doubleCount = computed(() => this.counter() * 2);
  readonly hasItems = computed(() => this.items().length > 0);

  // Use inject() for DI (NO constructor injection)
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  increment(): void {
    this.counter.update(c => c + 1);
    this.valueChange.emit(this.counter());
  }
}
```

### Template Syntax (REQUIRED)

```html
<!-- Use @if (NOT *ngIf) -->
@if (isVisible) {
  <p>Content is visible</p>
} @else if (isLoading) {
  <p-progressSpinner />
} @else {
  <p>No content</p>
}

<!-- Use @for (NOT *ngFor) -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items found</p>
}

<!-- Use @switch (NOT *ngSwitch) -->
@switch (status) {
  @case ('pending') { <span>Pending</span> }
  @case ('approved') { <span>Approved</span> }
  @default { <span>Unknown</span> }
}

<!-- Signal values require () -->
<p>Count: {{ counter() }}</p>
<p>Double: {{ doubleCount() }}</p>
```

### Service Pattern (REQUIRED)

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/resource`;

  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();

  list(page = 1, limit = 20): Observable<PaginatedResponse<Item>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Item>>(this.apiUrl, { params })
      .pipe(tap(res => this._items.set(res.items)));
  }
}
```

### Routing (REQUIRED)

```typescript
// app.routes.ts — functional route guards, lazy-loaded components
export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/component/app.layout').then(m => m.AppLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'applications', canActivate: [orgAdminGuard], loadComponent: () => import('./features/applications/pages/applications-list').then(m => m.ApplicationsListComponent) },
    ],
  },
  { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes').then(m => m.AUTH_ROUTES) },
];
```

---

## CRITICAL: API Type System

### API Type Pattern (MANDATORY)

1. **Generated Types**: Use types from `src/app/core/types/api.types.ts` (auto-generated via `npm run generate:api`)
2. **Type Aliases**: Create clean aliases in `core/models/api.model.ts`
3. **NO Conversion**: API responses use snake_case fields — use them directly in TypeScript and templates
4. **Single Source of Truth**: OpenAPI spec defines ALL types — never create manual interfaces for API entities
5. **NEVER manually edit** `src/app/core/types/api.types.ts` — it's auto-generated

```typescript
// CORRECT - Type alias from generated types
export type Application = components['schemas']['ApplicationResponseDto'];

// CORRECT - Use snake_case in templates
// {{ application().created_on | date }}
// {{ application().test_mode_enabled ? 'Yes' : 'No' }}

// WRONG - Manual interface with camelCase
// export interface Application { applicationId: number; ... }
```

### Type Override Pattern (for backend serialization bugs only)

```typescript
export type Notification = Omit<
  components['schemas']['NotificationResponseDto'],
  'broken_field'
> & {
  broken_field?: number | null;
};
```

---

## Multi-Tenant / Role System

### Roles

| Role        | Value | Access                                       |
| ----------- | ----- | -------------------------------------------- |
| ORG_USER    | 0     | Read notifications within own org            |
| ORG_ADMIN   | 1     | Full CRUD within own org                     |
| SUPER_ADMIN | 2     | Platform-wide access, can switch org context |

### Org Context (SUPER_ADMIN)

- `OrgContextService` holds selected org in sessionStorage
- `orgContextInterceptor` auto-appends `organization_id` to all API requests
- `OrgSelectorComponent` in topbar — visible only to SUPER_ADMIN
- Route re-navigation on org switch to refresh data

### Route Guards

- `authGuard` — requires authentication for all main routes
- `orgAdminGuard` — requires ORG_ADMIN or higher (config routes)
- `superAdminGuard` — requires SUPER_ADMIN (organizations route)

---

## Interceptor Chain

Registered in `app.config.ts` in this order:

1. **authInterceptor** — injects Bearer token, handles 401 with token refresh
2. **orgContextInterceptor** — appends `organization_id` when SUPER_ADMIN has org selected
3. **errorInterceptor** — shows toast for API errors

---

## PrimeNG Integration

### PrimeNG v20 Key Changes

- Import paths: `primeng/textarea` (NOT `primeng/inputtextarea`)
- Select component (previously Dropdown): `primeng/select`
- New theming: `@primeuix/themes`
- All components support **pass-through (pt) attributes** for deep DOM customization
- Use `[pt]` prop to target internal component elements with classes, styles, or event handlers
- Use `dt()` design token function to access theme CSS variables
- **Always use PrimeNG MCP** (`@primeng/mcp`) to look up component props, events, and templates before implementing

### Common Components

- **Form**: Textarea, InputText, InputNumber, Select, Checkbox, Password
- **Buttons**: Button, SpeedDial, SplitButton
- **Data**: Table, DataView, Tree, Timeline
- **Panels**: Card, Panel, Accordion, Tabs
- **Overlays**: Dialog, ConfirmDialog, Drawer, Toast
- **Menu**: Menubar, Menu, ContextMenu, Breadcrumb

```typescript
// Example: PrimeNG table with template syntax
@Component({
  imports: [TableModule, ButtonModule],
  template: `
    <p-table [value]="items()">
      <ng-template #header>
        <tr><th>Name</th><th>Status</th></tr>
      </ng-template>
      <ng-template #body let-item>
        <tr><td>{{ item.name }}</td><td>{{ item.status }}</td></tr>
      </ng-template>
    </p-table>
  `,
})
```

---

## Code Quality Rules

### Angular 20 Modern Patterns — NEVER / ALWAYS

- NEVER use `@Input()` / `@Output()` decorators → use `input()` / `output()` functions
- NEVER use `*ngIf` / `*ngFor` / `*ngSwitch` → use `@if` / `@for` / `@switch`
- NEVER use constructor injection → use `inject()` function
- NEVER mutate signals directly → use `.set()` / `.update()`
- NEVER use `[(ngModel)]` with signals → use `[ngModel]` + `(ngModelChange)` separately
- ALWAYS use `ChangeDetectionStrategy.OnPush`
- ALWAYS use signals for component state
- ALWAYS use `readonly` for signals and computed values
- ALWAYS use standalone components (NO NgModules)

### API Type System Rules

- NEVER create manual interfaces for API entities (use OpenAPI-generated types)
- NEVER convert API field names (snake_case → camelCase)
- NEVER manually edit `src/app/core/types/api.types.ts`
- ALWAYS use snake_case field names from API directly in code and templates
- ALWAYS create type aliases in model files for clean naming
- ALWAYS regenerate types after backend API changes

### Backend IsEnabledStatus Pattern

Backend uses `IsEnabledStatus` enum (`0` = disabled, `1` = enabled) for toggle fields like `test_mode_enabled`, `is_enabled`. Frontend services must convert booleans to `0`/`1` before sending:

```typescript
create(data: { name: string; test_mode_enabled?: boolean }): Observable<Application> {
  return this.http.post<Application>(this.apiUrl, {
    name: data.name,
    test_mode_enabled: data.test_mode_enabled ? 1 : 0,
  });
}
```

---

## Reference Implementation

The interview-app at `~/work/osmosys/interview-app/interview-app-frontend/` defines our coding standards. Adapt patterns for OsmoX (notification domain, multi-tenant, role-based UI).

---

**Remember**: This is Angular 20 with zoneless mode. Always use modern patterns (signals, standalone, new control flow). Never use deprecated patterns (decorators, NgModules, old control flow).
