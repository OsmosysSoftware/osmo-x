---
name: new-feature-page
description: Create a new feature page in the Angular portal following OsmoX conventions (standalone, signals, OnPush, inject, modern control flow). Use when adding a new page or feature component.
argument-hint: "[feature-name]"
---

# Create New Feature Page

Create a new feature page for `$ARGUMENTS` in the OsmoX portal.

## File Structure

```
apps/portal/src/app/features/$ARGUMENTS/
├── pages/
│   └── $ARGUMENTS-list.ts      # Main list page component
├── services/
│   └── $ARGUMENTS.service.ts   # API service (optional, can use HttpClient directly)
└── models/
    └── $ARGUMENTS.model.ts     # Type aliases from OpenAPI types (optional)
```

## Component Pattern (MANDATORY)

Every component MUST follow this pattern:

```typescript
import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-$ARGUMENTS-list',
  imports: [/* PrimeNG modules */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class ${ARGUMENTS}ListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/$ARGUMENTS`;

  readonly items = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<{ items: Record<string, unknown>[] }>(this.apiUrl)
      .subscribe({
        next: (res) => { this.items.set(res.items ?? []); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }
}
```

## Required Patterns

- `ChangeDetectionStrategy.OnPush` — MANDATORY on ALL components
- `inject()` for DI — NOT constructor injection
- `signal()` / `computed()` for state — NOT plain properties
- `@if` / `@for` / `@switch` in templates — NOT `*ngIf` / `*ngFor`
- `input()` / `output()` functions — NOT `@Input()` / `@Output()` decorators
- Use snake_case API field names directly — NO conversion

## Add Route

In `apps/portal/src/app/app.routes.ts`, add to the layout children:

```typescript
{
  path: '$ARGUMENTS',
  canActivate: [orgAdminGuard],  // adjust guard as needed
  loadComponent: () =>
    import('./features/$ARGUMENTS/pages/$ARGUMENTS-list').then(m => m.${ARGUMENTS}ListComponent),
},
```

## Add Menu Item

In `apps/portal/src/app/layout/component/app.menu.ts`, add to the appropriate menu group.

## After Creating

1. Run `npm run lint` to verify
2. Run `npx ng build` to verify
3. Test the page in the browser
