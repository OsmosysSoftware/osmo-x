# Project Folder Structure and Guidelines

## Introduction

This document outlines the recommended folder structure for the OsmoX Portal, focusing on maintaining clarity, scalability, and maintainability.

## Angular 20 Best Practices

This project follows Angular 20 best practices including:
- **Standalone Components**: All components are standalone by default
- **Signals**: Use signals for reactive state management
- **Input/Output Functions**: Use `input()` and `output()` functions instead of decorators
- **Control Flow**: Use `@if`, `@for`, `@switch` instead of structural directives
- **Modern Patterns**: Leverage `computed()`, `inject()`, and other modern Angular features
- **Zoneless**: Uses `provideZonelessChangeDetection()` — no Zone.js

## Folder Structure

### `src`

The `src` folder serves as the root of the application's source code:

1. **`assets`**: Images, icons, and static files
2. **`app`**: Core components and logic of the application
3. **`index.html`**: Main HTML file and entry point
4. **`main.ts`**: Main TypeScript file for bootstrapping the application

### `app`

The `app` folder is organized into these sub folders:

1. **`core`**: Essential elements that define the foundation of the application
2. **`features`**: Feature-specific modules (lazy-loaded)
3. **`shared`**: Reusable components, directives, and pipes shared across the project
4. **`layout`**: Application layout components (topbar, sidebar, menu, footer, configurator)
5. **`pages`**: Standalone pages outside the main layout (login, not-found, error)

#### `core`

The `core` folder focuses on elements integral to the application's operation:

1. **`constants`**: Core constants (API URLs, route paths, enums)
2. **`guards`**: Route guards (auth guard, admin guard, super admin guard)
3. **`interceptors`**: HTTP interceptors (auth interceptor, error interceptor)
4. **`models`**: Core data models and interfaces
5. **`services`**: Core services (auth service, etc.)
6. **`types`**: OpenAPI generated types (`npm run generate:api`)

#### `features`

The `features` folder separates different application features into distinct modules. Each feature folder contains:

1. **`components`**: Components specific to the feature
2. **`models`**: Data structures unique to the feature
3. **`pages`**: Feature-specific pages
4. **`services`**: Services tailored to the feature

Planned features:
- `dashboard/` — Overview stats and charts
- `applications/` — Application CRUD and management
- `providers/` — Provider configuration
- `provider-chains/` — Provider chain management with member ordering
- `notifications/` — Notification list and detail views
- `archived-notifications/` — Archived notification views
- `users/` — User management (Org Admin)
- `api-keys/` — API key generation and management
- `webhooks/` — Webhook CRUD
- `super-admin/` — Organization management (Super Admin)

#### `shared`

Reusable components, directives, and pipes shared across different features:

1. **`components`**: Reusable components (logo, status-badge, confirm-dialog, data-table)
2. **`directives`**: Custom directives
3. **`pipes`**: Pipes for data transformation (delivery-status, channel-type)

#### `layout`

Application shell components based on PrimeNG Sakai template:

1. **`component`**: Layout components (topbar, sidebar, menu, footer, configurator)
2. **`service`**: Layout service for theme/menu state management

## Angular 20 Component Guidelines

### Component Structure
```typescript
import { Component, signal, computed, input, output, inject, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-example',
  imports: [/* standalone imports */],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  // DI via inject() — no constructor injection
  private readonly myService = inject(MyService);

  // Use input() function instead of @Input() decorator
  readonly title = input<string>('');

  // Use output() function instead of @Output() decorator
  readonly itemSelected = output<string>();

  // Use signals for local state
  private readonly count = signal(0);

  // Use computed for derived state
  readonly doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(value => value + 1);
    this.itemSelected.emit('incremented');
  }
}
```

### Template Guidelines
```html
<!-- Use @if instead of *ngIf -->
@if (isVisible()) {
  <div>Content</div>
}

<!-- Use @for instead of *ngFor -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

<!-- Use @switch instead of *ngSwitch -->
@switch (status()) {
  @case ('loading') {
    <div>Loading...</div>
  }
  @case ('success') {
    <div>Success!</div>
  }
  @default {
    <div>Default</div>
  }
}
```

## Best Practices

- **Standalone Components**: Always use standalone components over NgModules
- **Signals**: Use signals for reactive state management
- **Input/Output Functions**: Use `input()` and `output()` functions instead of decorators
- **Control Flow**: Use `@if`, `@for`, `@switch` instead of structural directives
- **Computed**: Use `computed()` for derived state
- **Inject**: Use `inject()` function instead of constructor injection
- **OnPush**: Always use `ChangeDetectionStrategy.OnPush` for performance
- **Single Responsibility**: Keep components focused and small
- **Type Safety**: Use strict TypeScript settings

## API Integration

- Types are generated from the backend OpenAPI spec: `npm run generate:api`
- API responses use `snake_case` field names — no conversion needed, use as-is
- Use `openapi-fetch` for type-safe HTTP calls

## Maintenance Guidelines

- Create new feature modules with dedicated folders when adding new functionality
- Utilize the `shared` folder for adding reusable components, directives, and pipes
- Regularly remove unused code to prevent clutter and confusion
- Follow Angular 20 best practices for all new components and services
- Update this document whenever significant changes to the folder structure are made
