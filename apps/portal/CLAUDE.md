# CLAUDE.md - OsmoX Portal Development Guidelines

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL INSTRUCTIONS - MUST FOLLOW

### 1. ALWAYS Use Context7 MCP Server for Latest Documentation

- **Use Context7** to fetch the latest documentation for Angular, PrimeNG, Tailwind CSS, etc.
- **Never rely on outdated knowledge** - Always fetch current docs before implementing
- **Example:** Before using a PrimeNG component, use Context7 to get latest API and usage patterns
- **PrimeNG Component Index:** See `.llms-full.txt` in this directory for a complete index of PrimeNG v20 components with documentation URLs

---

### 2. ALWAYS Update CLAUDE.md

- **After every architectural decision** - Document the pattern
- **After adding new features** - Update project structure
- **After discovering new patterns** - Add to best practices
- **Keep as single source of truth** for this portal repository

---

## Project Overview

OsmoX Portal is an Angular 20+ application for managing the OsmoX notification platform. It provides CRUD management for organizations, applications, providers, provider chains, notifications, users, API keys, and webhooks.

## Development Commands

### Run & Build

```bash
npm start              # Start development server (ng serve, localhost:4200)
npm run build          # Production build
npm run build:prod     # Production build (alias)
npm run watch          # Build in watch mode
```

### Code Quality

```bash
npm run lint           # Run ESLint with zero warnings tolerance
npm run lint:fix       # Auto-fix linting issues
npm run prettier-format # Format all code with Prettier
npm run lint-fix-format # Complete cleanup: format -> lint:fix -> format
```

### Testing

```bash
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
```

### API Type Generation

```bash
npm run generate:api   # Regenerate TypeScript types from backend OpenAPI spec
```

This runs `openapi-typescript` against `http://localhost:3000/api/docs-json` and outputs to `src/app/core/types/api.types.ts`.

---

## Architecture

### Tech Stack

- **Angular 20**: Zoneless change detection, signals, standalone components
- **PrimeNG v20**: Comprehensive UI component library
- **PrimeIcons**: Icon library from PrimeNG
- **Tailwind CSS v4**: Utility-first CSS framework with tailwindcss-primeui plugin
- **TypeScript**: Strongly typed development
- **ESLint + Prettier**: Code quality and formatting

### Folder Structure

```text
src/
├── app/
│   ├── core/                # Singleton services, guards, interceptors
│   │   ├── constants/       # API URLs, route paths
│   │   ├── guards/          # Functional route guards
│   │   ├── interceptors/    # Auth interceptor, error interceptor
│   │   ├── models/          # Type aliases from OpenAPI types
│   │   ├── services/        # Auth, user, and other core services
│   │   ├── types/           # Auto-generated OpenAPI types (DO NOT EDIT)
│   │   └── utils/           # Utility functions
│   ├── features/            # Feature modules (lazy-loaded routes)
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── providers/
│   │   ├── provider-chains/
│   │   ├── notifications/
│   │   ├── archived-notifications/
│   │   ├── users/
│   │   ├── api-keys/
│   │   ├── webhooks/
│   │   └── super-admin/
│   ├── shared/              # Reusable components, directives, pipes
│   │   ├── components/      # pagination, status-badge, confirm-dialog, data-table
│   │   ├── directives/
│   │   ├── pipes/           # delivery-status, channel-type
│   │   └── utils/
│   ├── layout/              # App shell and navigation (Sakai-based)
│   │   ├── app-layout.component.ts
│   │   ├── app-topbar.component.ts
│   │   ├── app-sidebar.component.ts
│   │   ├── app-menu.component.ts
│   │   └── app-footer.component.ts
│   ├── pages/               # Non-feature pages
│   │   ├── login/
│   │   └── not-found/
│   ├── app.config.ts        # Application configuration (providers)
│   ├── app.routes.ts        # Route definitions
│   └── app.ts               # Root component
├── environments/
│   ├── environment.ts       # Development config
│   └── environment.production.ts
├── styles.scss              # Global styles
└── assets/                  # Static assets
```

---

## CRITICAL: Zoneless Architecture

**IMPORTANT**: This application uses Angular's zoneless mode with signals. Always ensure zoneless compatibility.

### Zoneless Requirements (MANDATORY)

1. **NO Zone.js**: This app does NOT use Zone.js for change detection
2. **Signals for State**: ALL component state MUST use signals, not plain properties
3. **Signal Updates**: Use `.set()`, `.update()` - NEVER direct assignment
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

**All components MUST follow this pattern:**

```typescript
import { Component, signal, computed, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  imports: [CommonModule],  // Standalone component imports
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,  // MANDATORY
})
export class ExampleComponent {
  // ALWAYS use input() function (NOT @Input decorator)
  readonly title = input.required<string>();
  readonly count = input<number>(0);  // With default

  // ALWAYS use output() function (NOT @Output decorator)
  readonly valueChange = output<number>();
  readonly complete = output<void>();

  // ALWAYS use signals for state
  readonly counter = signal(0);
  readonly items = signal<string[]>([]);

  // Use computed() for derived state
  readonly doubleCount = computed(() => this.counter() * 2);
  readonly hasItems = computed(() => this.items().length > 0);

  // Use inject() for dependency injection (NO constructor)
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  // Methods
  increment(): void {
    this.counter.update(c => c + 1);
    this.valueChange.emit(this.counter());
  }
}
```

### Template Syntax (REQUIRED)

**All templates MUST use modern control flow:**

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

### Services (REQUIRED)

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })  // ALWAYS providedIn: 'root' for core services
export class DataService {
  // Use inject() (NO constructor injection)
  private readonly http = inject(HttpClient);

  // Use signals for service state
  private readonly data = signal<Item[]>([]);
  readonly items = computed(() => this.data());
  readonly count = computed(() => this.data().length);

  // Methods
  loadData(): Observable<Item[]> {
    return this.http.get<Item[]>('/api/items').pipe(
      tap(items => this.data.set(items))
    );
  }

  addItem(item: Item): void {
    this.data.update(items => [...items, item]);
  }
}
```

### Routing (REQUIRED)

**Use functional route guards:**

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { inject } from '@angular/core';

const authGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      // ... more routes
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  }
];
```

---

## CRITICAL: API Type System

**IMPORTANT**: This application uses OpenAPI-generated types. ALL API responses MUST use generated types directly WITHOUT transformation.

### API Type Pattern (MANDATORY)

1. **Generated Types**: Use types from `src/app/core/types/api.types.ts` (auto-generated via `npm run generate:api`)
2. **Type Aliases**: Create clean aliases in model files (e.g., `src/app/core/models/notification.model.ts`)
3. **NO Conversion**: API responses use snake_case fields - use them directly in TypeScript and templates
4. **Single Source of Truth**: OpenAPI spec defines ALL types - never create manual interfaces for API entities
5. **NEVER manually edit** `src/app/core/types/api.types.ts` - it's auto-generated

### Example: Using Generated API Types

```typescript
import { components } from '../types/api.types';

// CORRECT - Type alias for generated type
export type Application = components['schemas']['ApplicationResponseDto'];
export type Notification = components['schemas']['NotificationResponseDto'];
export type PaginatedResponse<T> = {
  items: T[];
  page_info: components['schemas']['PaginationMeta'];
};

// WRONG - Manual interface with camelCase
// export interface Application { applicationId: number; ... }
```

### Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/applications`;

  getApplications(page = 1, limit = 20): Observable<PaginatedResponse<Application>> {
    return this.http.get<PaginatedResponse<Application>>(this.apiUrl, {
      params: { page, limit },
    });
    // NO .pipe(map(convert...)) - use response directly!
  }
}
```

### Template Usage

```html
<!-- Use snake_case field names directly from API -->
<p>App: {{ application().name }}</p>
<p>Created: {{ application().created_on | date }}</p>
<p>Test Mode: {{ application().test_mode_enabled ? 'Yes' : 'No' }}</p>
```

### Type Override Pattern (for backend serialization bugs only)

```typescript
export type Notification = Omit<
  components['schemas']['NotificationResponseDto'],
  'broken_field'
> & {
  broken_field?: number | null;  // Override with correct type
};
```

---

## PrimeNG Integration

### Using PrimeNG Components

```typescript
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-example',
  imports: [ButtonModule, InputTextModule, TableModule],
  template: `
    <p-button label="Click me" icon="pi pi-check" (onClick)="handleClick()" />

    <input pInputText [(ngModel)]="value" placeholder="Enter text" />

    <p-table [value]="items()">
      <ng-template #header>
        <tr><th>Name</th><th>Status</th></tr>
      </ng-template>
      <ng-template #body let-item>
        <tr><td>{{ item.name }}</td><td>{{ item.status }}</td></tr>
      </ng-template>
    </p-table>
  `
})
```

### PrimeNG v20 Key Changes

- Import paths: `primeng/textarea` (NOT `primeng/inputtextarea`)
- Select component (previously Dropdown): `primeng/select`
- New theming: `@primeuix/themes`
- All components support pass-through attributes

### Common Components

- **Form**: Textarea, InputText, InputNumber, Select, Checkbox, Password
- **Buttons**: Button, SpeedDial, SplitButton
- **Data**: Table, DataView, Tree, Timeline
- **Panels**: Card, Panel, Accordion, Tabs
- **Overlays**: Dialog, ConfirmDialog, Drawer, Toast
- **Menu**: Menubar, Menu, ContextMenu, Breadcrumb

---

## Application Config

```typescript
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { Aura } from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),     // NO Zone.js
    provideAnimationsAsync(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
    MessageService,
  ],
};
```

---

## Auth Implementation (Signal-based)

### Auth Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/v1/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('auth_refresh_token', response.refresh_token);
        this._currentUser.set(response.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
```

### Auth Interceptor (Functional)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Handle token refresh or redirect to login
      }
      return throwError(() => error);
    }),
  );
};
```

### Error Interceptor (Functional)

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError(error => {
      const detail = error.error?.detail || error.message || 'An unexpected error occurred';

      messageService.add({ severity: 'error', summary: 'Error', detail });

      return throwError(() => error);
    }),
  );
};
```

---

## Code Quality Rules

### Angular 20 Modern Patterns

- NEVER use `@Input()` / `@Output()` decorators → Use `input()` / `output()` functions
- NEVER use `*ngIf` / `*ngFor` / `*ngSwitch` → Use `@if` / `@for` / `@switch`
- NEVER use constructor injection → Use `inject()` function
- NEVER mutate signals directly → Use `.set()` / `.update()`
- ALWAYS use `ChangeDetectionStrategy.OnPush`
- ALWAYS use signals for component state
- ALWAYS use `readonly` for signals and computed values
- ALWAYS use standalone components

### API Type System Rules

- NEVER create manual interfaces for API entities (use OpenAPI-generated types)
- NEVER convert API field names (snake_case → camelCase)
- NEVER manually edit `src/app/core/types/api.types.ts`
- ALWAYS use snake_case field names from API directly in code and templates
- ALWAYS create type aliases in model files for clean naming
- ALWAYS regenerate types after backend API changes

### File Naming Convention

- Components: `user-list.component.ts`
- Services: `auth.service.ts`
- Guards: `auth.guard.ts`
- Pipes: `delivery-status.pipe.ts`
- Directives: `auto-focus.directive.ts`
- Models: `notification.model.ts`

---

## Git Commit Standards

- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`
- Example: `feat: add application CRUD components`
- Keep commits clean - no promotional or attribution content

---

## Adding New Features

### New Feature Module

```bash
# Create feature directory
mkdir -p src/app/features/my-feature/{components,pages,services,models}

# Create components
ng generate component features/my-feature/pages/my-page --standalone

# Create service
ng generate service features/my-feature/services/my-service
```

### Add Route

```typescript
// In app.routes.ts, add to layout children:
{
  path: 'my-feature',
  loadComponent: () => import('./features/my-feature/pages/my-page/my-page.component')
    .then(m => m.MyPageComponent),
}
```

---

## Environment Configuration

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

// environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain/api',
};
```

---

## Reference Implementation

The interview-app at `~/work/osmosys/interview-app/interview-app-frontend/` defines our coding standards. When implementing new patterns, check:

- **App config:** `app.config.ts` (providers setup)
- **Auth service:** `core/services/auth.service.ts` (signal-based auth)
- **Interceptors:** `core/interceptors/` (auth + error interceptors)
- **Layout:** `layout/` (Sakai-based shell)
- **API types:** `core/types/api.types.ts` (OpenAPI generated)

Adapt patterns for OsmoX (notification domain, multi-tenant, role-based UI).

---

**Remember**: This is Angular 20 with zoneless mode. Always use modern patterns (signals, standalone, new control flow). Never use deprecated patterns (decorators, NgModules, old control flow).
