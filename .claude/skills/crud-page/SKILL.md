---
name: crud-page
description: Generate a complete CRUD or read-only list page in the Angular portal with service, routing, and menu integration. Use when adding a new feature page to the portal.
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
- **Types exist** — type alias already in `core/models/api.model.ts` derived from generated OpenAPI types (ask which type name)
- **Generate types** — run `npm run generate:api` first, then add type alias to `api.model.ts` (see Step 3)
- **No API yet** — stub service with `Record<string, unknown>`, user wires up later

### Batch 2

**Q5 — Entity fields** (if "Create types" was selected, or for table/form generation):

Ask the user to describe fields. Use this format:
> List fields as `field_name: type`. Annotate with:
> - `*` = primary key (shown in table, not editable in form)
> - `+` = editable (shown in both table and create/edit form)
> - No annotation = display-only (shown in table, not in form)
>
> Example: `*application_id: number, +name: string, +test_mode_enabled: boolean, status: number, created_on: string`

**Q6 — Pagination:**
- **Client-side** — all data loaded at once, `p-table` handles pagination internally (small datasets)
- **Server-side** — `p-table` with `[lazy]="true"`, `[totalRecords]`, and `(onLazyLoad)` event (large datasets). Sorting is also passed to the API via `onLazyLoad`.

**Q7 — Default sort:**
- Which field should the table sort by initially? (e.g., `created_on`, `name`)
- Sort order: **Descending** (newest first, default) or **Ascending**

**Q8 — Table features** (multi-select, all optional):
- **CSV export** — adds an export button to the toolbar that calls `dt.exportCSV()`
- **Import** — adds file upload button + dialog for importing data (requires backend endpoint)
- **None** — just the standard table

## Step 2: Check API Capabilities

If an API endpoint exists for this feature, read the backend controller and/or Swagger docs to determine:
- What query params does the list endpoint support? (All v1 endpoints support `page`, `limit`, `sort`, `order`)
- Are there any feature-specific filters?
- What fields are returned in the response DTO?

Use this info to configure the service and table correctly. All v1 APIs use `PaginationQueryDto` which supports:
- `page` (number, default 1)
- `limit` (number, default 20, max 1000)
- `sort` (snake_case field name, e.g. `created_on`)
- `order` (`asc` or `desc`, default `desc`)

## Step 3: Read Reference Files

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
- `apps/portal/src/app/features/applications/pages/applications-list.ts` (lazy-loading component pattern)

### Always read:
- `apps/portal/src/app/app.routes.ts` (routing structure)
- `apps/portal/src/app/layout/component/app.menu.ts` (menu structure)
- `apps/portal/src/app/core/models/api.model.ts` (existing entity interfaces)

## Step 4: Scaffold and Generate Files

Use Angular CLI to scaffold files, then fill in the code adapting patterns from the reference files.

### Scaffold with `ng generate`

Run from `apps/portal/`:

```bash
cd apps/portal
npx ng generate component features/<feature-name>/pages/<feature-name>-list --flat
npx ng generate service features/<feature-name>/services/<feature-name>
```

This creates the component (`.ts`, `.html`, `.scss`) and service (`.ts`) files with correct boilerplate. Then replace the generated content with the patterns below.

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
- **No raw DB ID columns** — generally avoid showing primary key IDs in tables. Resolve foreign key IDs to human-readable names using lookup methods. Exception: notification/archived-notification tables show the notification ID for debugging purposes
- **Toolbar layout** — always include both `#start` and `#end` templates in `p-toolbar`. For read-only pages with no action buttons, use an empty `<ng-template #start></ng-template>` to keep search/refresh right-aligned

### Template structure

```text
<div class="card">
  <!-- Page header -->
  <div> <h1> icon + title </h1> <p> subtitle </p> </div>

  <!-- Toolbar -->
  <p-toolbar>
    #start: New button (CRUD only)
    #end: export button (if enabled) + search input + refresh button
  </p-toolbar>

  <!-- Loading or data -->
  @if (loading()) { <p-skeleton /> }
  @else {
    <p-table #dt [value]="items()" [paginator]="true" [rows]="10"
      [stripedRows]="true" [rowHover]="true"
      [sortField]="'default_field'" [sortOrder]="-1" ...>
      #header: column headers with pSortableColumn
      #body: data rows with action buttons
      #emptymessage: "No items found"
    </p-table>
  }

  <!-- Create/Edit dialog (CRUD only) -->
  <p-dialog [visible]="dialogVisible()" ... />

  <!-- Import dialog (if enabled) -->

  <!-- Confirm delete dialog (CRUD only) -->
  <p-confirmDialog />
</div>
```

### Sorting on p-table

Always add `pSortableColumn` and `p-sortIcon` to sortable column headers. Set the default sort via:

```html
<p-table [sortField]="'created_on'" [sortOrder]="-1" ...>
```

- `[sortOrder]="-1"` = descending (newest first)
- `[sortOrder]="1"` = ascending

For **server-side** lazy mode, sorting is handled via the `onLazyLoad` event — see below.

### Pagination on p-table

**Client-side** (all data loaded at once):
```html
<p-table [value]="items()" [paginator]="true" [rows]="10"
  [stripedRows]="true" [rowHover]="true"
  [sortField]="'created_on'" [sortOrder]="-1"
  [rowsPerPageOptions]="[10, 20, 50]" [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items">
```

**Server-side** (lazy loading — data fetched per page, sort passed to API):
```html
<p-table [value]="items()" [paginator]="true" [rows]="20"
  [lazy]="true" [totalRecords]="totalRecords()" (onLazyLoad)="onLazyLoad($event)"
  [stripedRows]="true" [rowHover]="true"
  [sortField]="'created_on'" [sortOrder]="-1"
  [rowsPerPageOptions]="[10, 20, 50]" [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items">
```

Component method for server-side:
```typescript
import { TableLazyLoadEvent } from 'primeng/table';

readonly totalRecords = signal(0);

onLazyLoad(event: TableLazyLoadEvent): void {
  const page = Math.floor((event.first ?? 0) / (event.rows ?? 20)) + 1;
  const limit = event.rows ?? 20;
  const sort = event.sortField as string | undefined;
  const order = event.sortOrder === 1 ? 'asc' : 'desc';
  this.loadItems(page, limit, sort, order);
}
```

### CSV export (if enabled)

Add export button to toolbar `#end`:
```html
<p-button icon="pi pi-download" severity="secondary" [text]="true"
  [rounded]="true" pTooltip="Export CSV" (onClick)="dt.exportCSV()" />
```

No extra component logic needed — `dt` is the template reference to `p-table`, and `exportCSV()` is built-in.

### Import (if enabled)

Add import button to toolbar `#start` (next to "New" button):
```html
<p-button label="Import" icon="pi pi-upload" severity="secondary" (onClick)="importDialogVisible.set(true)" />
```

Add import dialog with file upload:
```html
<p-dialog [visible]="importDialogVisible()" (visibleChange)="importDialogVisible.set($event)"
  header="Import Data" [modal]="true" [style]="{ width: '28rem' }">
  <p-fileUpload mode="basic" accept=".csv,.json" [auto]="true"
    (onUpload)="onImportUpload($event)" chooseLabel="Choose File" />
</p-dialog>
```

Component:
```typescript
readonly importDialogVisible = signal(false);

onImportUpload(event: { files: File[] }): void {
  // Wire to backend import endpoint
  this.importDialogVisible.set(false);
  this.loadItems();
}
```

### Service patterns

**List with sort params** (all v1 APIs support this):
```typescript
list(page = 1, limit = 20, sort?: string, order?: string): Observable<PaginatedResponse<T>> {
  let params = new HttpParams().set('page', page).set('limit', limit);
  if (sort) { params = params.set('sort', sort); }
  if (order) { params = params.set('order', order); }
  return this.http.get<PaginatedResponse<T>>(this.apiUrl, { params });
}
```

**DELETE always uses request body** (not URL path param):
```typescript
delete(id: number): Observable<boolean> {
  return this.http.delete<boolean>(this.apiUrl, { body: { entity_id: id } });
}
```

**Search options:**
- **Client-side** — via `[globalFilterFields]` on `p-table`. Filters within currently-loaded page data. Good for small datasets.
- **Server-side** — via `search` query param on `PaginationQueryDto`. Searches across `data`, `result`, and `createdBy` fields on the backend. Use for large datasets or when searching JSONB fields. Debounce input with ~400ms timeout.

```typescript
// Server-side search in service
list(page = 1, limit = 20, filters?: { search?: string }): Observable<PaginatedResponse<T>> {
  let params = new HttpParams().set('page', page).set('limit', limit);
  if (filters?.search) { params = params.set('search', filters.search); }
  return this.http.get<PaginatedResponse<T>>(this.apiUrl, { params });
}
```

**Server-side filter dropdowns** (for filterable columns like channel_type, delivery_status, application_id):

Add `p-select` dropdowns in toolbar `#start`:
```html
<ng-template #start>
  <div class="flex items-center gap-2 flex-wrap">
    <p-select [options]="channelTypeOptions" [(ngModel)]="selectedChannelType"
      placeholder="Channel type" [showClear]="true" (onChange)="onFilterChange()"
      [style]="{ minWidth: '10rem' }" />
  </div>
</ng-template>
```

Requires `FormsModule` and `SelectModule` in component imports. Each filter change resets to page 1 and reloads data with filter params.

**JSON viewer dialog** for large JSON columns (data, result, configuration):

Use the shared `JsonViewerDialog` component from `shared/components/json-viewer-dialog/json-viewer-dialog`. Add a "View" button in the table cell:
```html
<td>
  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info"
    pTooltip="View data" tooltipPosition="top"
    (onClick)="viewJson(n.data, 'Data'); $event.stopPropagation()" />
</td>
```

Component needs `jsonDialogVisible`, `jsonDialogData`, `jsonDialogHeader` signals and a `viewJson()` method. Include `<app-json-viewer-dialog>` at the bottom of the template.

## Step 5: Wire Up Routing and Menu

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

### Add type alias to `api.model.ts` (if generating types)

After running `npm run generate:api`, add a type alias in `core/models/api.model.ts`:
```typescript
import { components } from '../types/api.types';
export type MyEntity = components['schemas']['MyEntityResponseDto'];
export type CreateMyEntityInput = components['schemas']['CreateMyEntityInput'];
export type UpdateMyEntityInput = components['schemas']['UpdateMyEntityInput'];
```
NEVER create manual interfaces for API entities — always derive from the generated types.

## Step 6: Verify

1. Run `cd apps/portal && npx ng build` — must succeed with zero errors
2. Run `cd apps/portal && npm run lint` — must pass
3. Navigate to the page in the browser and verify it loads
