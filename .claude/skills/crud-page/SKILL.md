---
name: crud-page
description: Generate a complete CRUD or read-only list page in the Angular portal with service, routing, and menu integration. Use when adding a new feature page to the portal.
argument-hint: "[feature-name]"
---

# Generate Portal CRUD Page

Generate a complete feature page for `$ARGUMENTS` in the OsmoX portal.

## Step 1: Gather Requirements

Ask the user the following questions using `AskUserQuestion`. Batch related questions together (max 4 per call). Do NOT proceed until all answers are collected.

### Batch 1

**Q1 — Page type:**
- **Full CRUD** (list + create/edit dialog + delete confirmation) — default
- **Read-only list** (list only, no create/edit/delete)

**Q2 — Access role:**
- **Any authenticated user** — no route guard
- **ORG_ADMIN or higher** — `orgAdminGuard` (default for config pages)
- **SUPER_ADMIN only** — `superAdminGuard`

**Q3 — Menu group:**
- Home / Notifications / Configuration / Administration
- Also ask for a PrimeIcons icon name (e.g., `pi-sitemap`, `pi-link`, `pi-users`)

**Q4 — API integration:**
- **Types exist** — entity interface already in `core/models/api.model.ts` (ask which interface name)
- **Create types** — ask for entity fields (see Q5)
- **No API yet** — stub service with `Record<string, unknown>`, user wires up later

### Batch 2 (if needed)

**Q5 — Entity fields** (if "Create types" was selected, or for table/form generation):

Ask the user to describe fields. Use this format:
> List fields as `field_name: type`. Annotate with:
> - `*` = primary key (shown in table, not editable in form)
> - `+` = editable (shown in both table and create/edit form)
> - No annotation = display-only (shown in table, not in form)
>
> Example: `*application_id: number, +name: string, +test_mode_enabled: boolean, status: number, created_on: string`

**Q6 — Pagination:**
- **Client-side** — all data loaded at once, `p-table` handles pagination (small datasets)
- **Server-side** — paginated API calls with `<app-pagination>` component (large datasets)

## Step 2: Read Reference Files

Before generating code, read the relevant canonical examples to match the exact patterns:

### For Full CRUD pages, read:
- `apps/portal/src/app/features/super-admin/pages/organizations-list.ts` (component pattern)
- `apps/portal/src/app/features/super-admin/pages/organizations-list.html` (template pattern)
- `apps/portal/src/app/features/super-admin/services/organizations.service.ts` (simple service)

### For Read-only pages, read:
- `apps/portal/src/app/features/notifications/pages/notifications-list.ts`
- `apps/portal/src/app/features/notifications/pages/notifications-list.html`

### For server-side pagination, also read:
- `apps/portal/src/app/features/applications/services/applications.service.ts` (paginated service)
- `apps/portal/src/app/shared/components/pagination/pagination.ts` (pagination component)

### Always read:
- `apps/portal/src/app/app.routes.ts` (routing structure)
- `apps/portal/src/app/layout/component/app.menu.ts` (menu structure)
- `apps/portal/src/app/core/models/api.model.ts` (existing entity interfaces)

## Step 3: Generate Files

Create the following files, adapting the patterns from the reference files:

### File structure

```text
apps/portal/src/app/features/<feature-name>/
├── pages/
│   ├── <feature-name>-list.ts        # Component class
│   ├── <feature-name>-list.html      # Template
│   └── <feature-name>-list.scss      # Styles (empty placeholder)
└── services/
    └── <feature-name>.service.ts     # API service
```

### Naming conventions

| Concept | Format | Example (`provider-chain-members`) |
| --- | --- | --- |
| Feature dir | `features/<kebab-name>/` | `features/provider-chain-members/` |
| Component class | `<PascalName>ListComponent` | `ProviderChainMembersListComponent` |
| Selector | `app-<kebab-name>-list` | `app-provider-chain-members-list` |
| Service class | `<PascalName>Service` | `ProviderChainMembersService` |
| Template | `<kebab-name>-list.html` | `provider-chain-members-list.html` |

### Mandatory patterns (ALL components)

- `ChangeDetectionStrategy.OnPush` — always
- `inject()` for DI — NOT constructor injection
- `signal()` / `computed()` for state — NOT plain properties
- `@if` / `@for` in templates — NOT `*ngIf` / `*ngFor`
- `templateUrl` + `styleUrl` — NO inline `template` or `styles`
- `standalone: true` is implicit in Angular 20 (omit from decorator)
- `viewChild<Table>('dt')` for table reference
- `MessageService` injected but NOT in component `providers[]` (it's global)
- `ConfirmationService` in component `providers[]` (CRUD pages only)

### Template structure

```text
<div class="card">
  <!-- Page header -->
  <div> <h1> icon + title </h1> <p> subtitle </p> </div>

  <!-- Toolbar: New button (CRUD only) + search + refresh -->
  <p-toolbar>
    #start: New button (CRUD) or empty
    #end: search input + refresh button
  </p-toolbar>

  <!-- Loading or data -->
  @if (loading()) { <p-skeleton /> }
  @else {
    <p-card>
      <p-table #dt [value]="items()" ...>
        #header: column headers with pSortableColumn
        #body: data rows with action buttons
        #emptymessage: "No items found"
      </p-table>

      <!-- Server-side pagination (if applicable) -->
      <app-pagination [pageInfo]="pi" (pageChange)="onPageChange($event)" />
    </p-card>
  }

  <!-- Create/Edit dialog (CRUD only) -->
  <p-dialog [visible]="dialogVisible()" ... />

  <!-- Confirm delete dialog (CRUD only) -->
  <p-confirmDialog />
</div>
```

### Service patterns

**DELETE always uses request body** (not URL path param):
```typescript
delete(id: number): Observable<boolean> {
  return this.http.delete<boolean>(this.apiUrl, { body: { entity_id: id } });
}
```

**Search is always client-side** via `[globalFilterFields]` on `p-table`. No server-side search API calls.

## Step 4: Wire Up Routing and Menu

### Add route to `app.routes.ts`

Add inside the `AppLayout` children array, in the appropriate section:

```typescript
{
  path: '<feature-name>',
  canActivate: [<guard>],  // omit if no guard
  loadComponent: () =>
    import('./features/<feature-name>/pages/<feature-name>-list').then(
      (m) => m.<PascalName>ListComponent,
    ),
},
```

### Add menu item to `app.menu.ts`

Add to the appropriate group in the `model` computed signal. If role-gated, add conditionally:

```typescript
// For role-gated items:
if (isOrgAdmin) {
  administrationItems.push({
    label: '<Display Name>',
    icon: 'pi pi-fw <icon>',
    routerLink: ['/<feature-name>'],
  });
}
```

### Add entity interface to `api.model.ts` (if creating types)

Add the interface with snake_case field names matching the backend response format.

## Step 5: Verify

1. Run `cd apps/portal && npx ng build` — must succeed with zero errors
2. Run `cd apps/portal && npm run lint` — must pass
3. Navigate to the page in the browser and verify it loads
