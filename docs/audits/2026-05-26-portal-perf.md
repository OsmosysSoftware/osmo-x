# Portal Performance Audit — 2026-05-26

**Scope:** apps/portal/src — Angular 20 / PrimeNG 20 / zoneless
**Method:** Static analysis only (no profiling, no Lighthouse)
**Auditor:** Claude general-purpose agent

## Summary
- High severity: 7 findings
- Medium: 11 findings
- Low: 9 findings

The portal is mostly disciplined (signals, OnPush almost everywhere, standalone, new control flow, lazy routes) but has a recurring anti-pattern: **method calls in templates inside `p-table` row templates** for label lookups (`getApplicationName`, `getProviderName`, etc.). Each method does an `Array.find()` and is invoked once per row per change-detection pass. The notification widgets create new empty arrays on every parent CD, retriggering chart re-init on a `setTimeout` chain. There is also a dialog where `[(ngModel)]` and direct mutation of items inside a signal break the project's mandated zoneless pattern and will cause stale renders.

## Findings (ranked)

### H1 — Template method calls do O(rows × dataset) work on every CD cycle

- **Files & lines:**
  - `apps/portal/src/app/features/notifications/pages/notifications-list.ts:315` (`getApplicationName`), `:321` (`getProviderName`) — called from `notifications-list.html:153-154,222,226`
  - `apps/portal/src/app/features/archived-notifications/pages/archived-list.ts:315,321` — called from `archived-list.html:140-141,211,215`
  - `apps/portal/src/app/features/provider-chains/pages/chains-list.ts:216-230` (`getProviderTypeLabel`, `getApplicationName`, `getProviderName`) — called from `chains-list.html:105-106,190`
  - `apps/portal/src/app/features/providers/pages/providers-list.ts:204` (`getApplicationName`) — called from `providers-list.html:100`
  - `apps/portal/src/app/features/api-keys/pages/api-keys-list.ts:111` (`getApplicationName`) — `api-keys-list.html:67`
  - `apps/portal/src/app/features/webhooks/pages/webhooks-list.ts:111` (`getProviderName`) — `webhooks-list.html:67`
  - `apps/portal/src/app/features/users/pages/users-list.ts:227,233` (`getDisplayName`, `getRoleLabel`) — `users-list.html:81,84`
  - `apps/portal/src/app/pages/dashboard/widgets/provider-health-widget.ts:43` (`getSeverity`) — `provider-health-widget.html:28`
- **Function/Component:** Multiple list pages
- **Category:** Function call in template (label lookup) + O(n) `Array.find` per call
- **Severity:** High
- **Why this matters:** Each table row triggers `Array.find` over `applications()`/`providers()` arrays (~100 items each) on every change detection. For a 20-row table that is 20 × ~100 = 2,000 comparisons per CD pass per column. Multiple methods per row compound this. Even in zoneless mode the table re-renders on every signal-driven CD (sort, filter, dialog open/close, hover state changes inside PrimeNG components). Pre-build a `Map<id, name>` once (the only place that already does this is `ChainMembersListComponent` — see `chain-members-list.ts:92-110`, which is the correct pattern), then either expose the map or expose pre-decorated rows via `computed()`.
- **Evidence:**
  ```typescript
  // notifications-list.ts:315
  getApplicationName(applicationId: number): string {
    const app = this.applications().find((a) => a.application_id === applicationId);
    return app?.name ?? `App #${applicationId}`;
  }
  ```
  ```html
  <!-- notifications-list.html:153 -->
  <td>{{ getApplicationName(n.application_id) }}</td>
  ```

### H2 — Dashboard widgets receive a fresh empty array on every CD cycle when `analytics()` is null, triggering chained `setTimeout(150)` chart re-init

- **File:** `apps/portal/src/app/pages/dashboard/dashboard.html:157-176`
- **Function/Component:** `DashboardComponent` → `NotificationTrendsWidget` / `ChannelBreakdownWidget` / `ApplicationStatsWidget` / `ProviderHealthWidget`
- **Category:** Signal misuse / Init-time blocking work
- **Severity:** High
- **Why this matters:** `[data]="analytics()?.trends ?? []"` evaluates to a brand-new `[]` literal on every CD cycle when analytics is null. Angular signal `input()` uses identity equality, so each new `[]` triggers the widget's `effect()` (notification-trends-widget.ts:36, channel-breakdown-widget.ts:47, application-stats-widget.ts:36) which calls `setTimeout(() => initChart(), 150)`. With three widgets each scheduling its own 150 ms timeout, this creates a flurry of pending timers and `getComputedStyle(document.documentElement)` reads (forced layout / style recalc) on every parent CD. Either stabilize the empty-array reference with a `computed()` or guard the effect on `data().length > 0`.
- **Evidence:**
  ```html
  <app-notification-trends-widget
    [data]="analytics()?.trends ?? []"
    [loading]="analyticsLoading()"
  />
  ```
  ```typescript
  // notification-trends-widget.ts:36
  effect(() => {
    this.layoutService.isDarkTheme();
    this.data();
    setTimeout(() => this.initChart(), 150);
  });
  ```

### H3 — Applications-list whitelist editor mutates signal contents directly via `[(ngModel)]` and `row.providerId = $event`

- **File:** `apps/portal/src/app/features/applications/pages/applications-list.html:181-198`
- **Function/Component:** `ApplicationsListComponent` (whitelist rows)
- **Category:** Signal misuse / Zoneless violation
- **Severity:** High
- **Why this matters:** Project CLAUDE.md explicitly forbids `[(ngModel)]` with signal-backed objects and direct property assignment. Here `(ngModelChange)="row.providerId = $event"` mutates the object held inside `whitelistRows` (signal) without calling `.set()` / `.update()`. In zoneless mode the signal never sees a change, the OnPush component never gets dirty, and the view stays stale or only refreshes when an unrelated signal changes. `[(ngModel)]="row.recipients"` has the same problem. The dialog is dialog-only so it appears to work because Angular re-evaluates on dialog open, but the whitelist saves can silently submit stale data. Convert to `[ngModel]` + `(ngModelChange)` that calls `whitelistRows.update(...)`.
- **Evidence:**
  ```html
  <p-select
    [options]="getAvailableProviders(row)"
    [ngModel]="row.providerId"
    (ngModelChange)="row.providerId = $event"
    ...
  />
  <p-autocomplete
    [(ngModel)]="row.recipients"
    ...
  />
  ```

### H4 — Reference-list services have no cache; every CRUD page navigation refetches applications + providers (and sometimes more)

- **Files:**
  - `apps/portal/src/app/features/applications/services/applications.service.ts:23`
  - `apps/portal/src/app/features/providers/services/providers.service.ts:23`
  - `apps/portal/src/app/features/notifications/pages/notifications-list.ts:141,150`
  - `apps/portal/src/app/features/archived-notifications/pages/archived-list.ts:141,150`
  - `apps/portal/src/app/features/providers/pages/providers-list.ts:117-126`
  - `apps/portal/src/app/features/provider-chains/pages/chains-list.ts:178-193`
  - `apps/portal/src/app/features/provider-chain-members/pages/chain-members-list.ts:138-148`
  - `apps/portal/src/app/features/api-keys/pages/api-keys-list.ts:82-86`
  - `apps/portal/src/app/features/webhooks/pages/webhooks-list.ts:82-86`
- **Function/Component:** All list pages
- **Category:** HTTP calls without caching
- **Severity:** High
- **Why this matters:** Eight list pages call `applicationsService.list(1, 100)` and seven call `providersService.list(1, 100)` from `ngOnInit`. The services hold a private signal of last response but each `list()` call still fires a fresh HTTP request, so flipping between Notifications → Archived → Providers → Provider Chains issues ~16 unnecessary requests per visit cycle. Add a `shareReplay({ bufferSize: 1, refCount: false })` cache (or convert to `toSignal(... computed)`) and let pages call a `loadIfStale()` helper. The same applies to the `OrgSelectorComponent` which refetches organizations on every mount (`org-selector.ts:33-35`) and the master-providers service (no cache at all).

### H5 — Org-switch full-route bounce: `router.navigateByUrl('/')` then back, dropping every page state and refetching everything

- **File:** `apps/portal/src/app/shared/components/org-selector/org-selector.ts:37-46`
- **Function/Component:** `OrgSelectorComponent.onOrgChange`
- **Category:** CD-triggering DOM events / Init-time blocking work
- **Severity:** High
- **Why this matters:** Switching organization tears down and re-mounts the current feature component twice (once to `/`, then back), causing the list page to lose its `currentPage`, `sortField`, filter state, and to re-issue every HTTP call (including the unnecessary apps + providers fetches from H4). For a SUPER_ADMIN that hops between organizations frequently this is the most expensive single user action in the app. Prefer a service-level signal that pages react to via `effect()` and explicit `loadX()` calls.
- **Evidence:**
  ```typescript
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigateByUrl(currentUrl);
  });
  ```

### H6 — `notification-filters` component listens to every document click via host binding

- **File:** `apps/portal/src/app/shared/components/notification-filters/notification-filters.ts:53-56`
- **Function/Component:** `NotificationFiltersComponent`
- **Category:** CD-triggering DOM events in hot loops
- **Severity:** High
- **Why this matters:** `host: { '(document:click)': 'onDocumentClick()' }` attaches a global click listener. Because this component is mounted on both Notifications and Archived list pages — the heaviest tables in the app — every click in the entire UI (including row hovers that produce clicks, dropdowns, dialog backdrops) triggers `onDocumentClick()`, which calls `dropdownVisible.set(false)`. Setting the signal to its current value (`false`) is cheap but `signal.set` still notifies subscribers and schedules CD. Replace with a one-shot listener attached only while `dropdownVisible()` is true (or use `Renderer2.listen` and tear down in `effect()` cleanup).

### H7 — `UsersListComponent` and `OrganizationsListComponent` request the full list with no pagination and render with client-side `[paginator]`

- **Files:**
  - `apps/portal/src/app/features/users/services/users.service.ts:18-20`
  - `apps/portal/src/app/features/super-admin/services/organizations.service.ts:22-26`
  - `apps/portal/src/app/features/users/pages/users-list.html:50-62`
  - `apps/portal/src/app/features/super-admin/pages/organizations-list.html:41-53`
- **Function/Component:** `UsersService.list`, `OrganizationsService.list`
- **Category:** Init-time blocking / Bundle / Memory at scale
- **Severity:** High
- **Why this matters:** Both endpoints return the entire collection with no `page`/`limit` parameters. The page then asks PrimeNG to paginate client-side. For SUPER_ADMIN with 10k+ users (the SaaS target) this means downloading the whole users table and keeping it in memory. PrimeNG will instantiate DOM only for one page (good) but the signal still holds every row. Add server-side pagination, and either virtual scrolling or server-side filter for searches.

### M1 — `app.topbar.ts` and `app.floatingconfigurator.ts` missing `ChangeDetectionStrategy.OnPush`

- **Files:**
  - `apps/portal/src/app/layout/component/app.topbar.ts:14-93`
  - `apps/portal/src/app/layout/component/app.floatingconfigurator.ts:8-36`
- **Function/Component:** `AppTopbar`, `AppFloatingConfigurator`
- **Category:** Missing OnPush
- **Severity:** Medium
- **Why this matters:** Project mandates OnPush on every component. In zoneless mode the default strategy effectively becomes OnPush-equivalent for signal-driven re-renders, but the lack of `changeDetection: ChangeDetectionStrategy.OnPush` means any future change to constructor-injection or class-field state can silently regress. Topbar runs on every authenticated page so it is the most-rendered component in the app.

### M2 — `AppLayout.containerClass` is a getter that returns a new object literal every CD cycle

- **File:** `apps/portal/src/app/layout/component/app.layout.ts:115-125`
- **Function/Component:** `AppLayout.containerClass`
- **Category:** Function call in template (binding)
- **Severity:** Medium
- **Why this matters:** `[ngClass]="containerClass"` calls the getter on each CD pass, allocating five `boolean | undefined` properties and an object. `NgClass` then diffs against the previous object; for the host layout div this is cheap individually but runs on every router event and every menu toggle. Convert to `computed()` based on `layoutConfig()`/`layoutState()`.

### M3 — `provider-chains` list calls `getChainMembers(chain_id)` four times per expanded row, each performing object spread and Map-equivalent lookups

- **File:** `apps/portal/src/app/features/provider-chains/pages/chains-list.html:146,152,166,168,179`
- **Function/Component:** `ChainsListComponent.getChainMembers`
- **Category:** Function call in template
- **Severity:** Medium
- **Why this matters:** Each expanded row calls `getChainMembers(c.chain_id)` ≥4 times. The method either returns a stable record or allocates a fresh `{ members: [], loading: true, … }` object literal when no entry exists. The fresh literal makes the `@if (getChainMembers(...).loading)` branch flip-flop visibility for unloaded chains (returns `loading:true` then `true` again — okay) but the repeated `membersMap()[chainId]` reads + object spreads happen on every CD. Compute a `chainMembers = computed(() => map.get(c.chain_id) ?? DEFAULT)` and reference it once.

### M4 — `getAvailableProviders(currentRow)` allocates a new `Set` and array per row per CD inside the applications whitelist editor

- **File:** `apps/portal/src/app/features/applications/pages/applications-list.ts:159-167`
- **Function/Component:** `ApplicationsListComponent.getAvailableProviders`
- **Category:** Function call in template
- **Severity:** Medium
- **Why this matters:** The template binds `[options]="getAvailableProviders(row)"` (`applications-list.html:181`). Each call recreates a `Set` from `whitelistRows()` and filters `appProviders()`. Combined with H3 (signal mutation), the option list reference changes constantly, which `p-select` interprets as a new options array. Hoist into a `computed()` keyed by `whitelistRows()` length+ids.

### M5 — `getProviderLabel` instantiates a new `ChannelTypePipe()` per call

- **File:** `apps/portal/src/app/features/applications/pages/applications-list.ts:155-157`
- **Function/Component:** `ApplicationsListComponent.getProviderLabel`
- **Category:** Repeated formatting / allocation
- **Severity:** Medium
- **Why this matters:** Called from `applications-list.html:191` and `:194` (twice per provider row), each invocation news up a pipe. Pipes are designed to be reused via the `|` pipe syntax in templates. Either declare it once as a private field (`private readonly channelPipe = new ChannelTypePipe();`) or apply it in the template via `provider.channel_type | channelType`.

### M6 — `app.menuitem` uses `@HostBinding` getters `isRoot` and `activeClass`

- **File:** `apps/portal/src/app/layout/component/app.menuitem.ts:118-121,142-145`
- **Function/Component:** `AppMenuitem`
- **Category:** Function call in binding
- **Severity:** Medium
- **Why this matters:** `HostBinding` getters are evaluated on every CD pass of the host. The menu is recursive — every menu item (and its children) re-evaluates these on every router event and on every `menuSource$` emission. Cheap individually, but multiplied by depth × siblings × emissions. Convert to `host: { '[class.active-menuitem]': 'active() && !root()' }` so Angular tracks signal dependencies instead of polling a getter.

### M7 — `Promise.resolve(null).then` indirection inside `menuSource$.subscribe`

- **File:** `apps/portal/src/app/layout/component/app.menuitem.ts:148-160`
- **Function/Component:** `AppMenuitem` constructor
- **Category:** Init-time blocking / Microtask churn
- **Severity:** Medium
- **Why this matters:** Every menu state change schedules a microtask per menu item. With ~10–15 menu items, that is ~15 microtasks per click. The wrapping looks like a workaround for change-detection timing in zone mode — likely unneeded in zoneless. Remove the `Promise.resolve(null).then(...)` wrapper and update the signal directly.

### M8 — Notifications + archived pages use `[hidden]="loading()"` on the table while ALSO rendering a sibling skeleton — table builds DOM during loading

- **Files:**
  - `apps/portal/src/app/features/notifications/pages/notifications-list.html:116-131`
  - `apps/portal/src/app/features/archived-notifications/pages/archived-list.html:103-118`
- **Function/Component:** Notifications & archived list pages
- **Category:** Init-time blocking
- **Severity:** Medium
- **Why this matters:** `@if (loading()) { skeleton }` is rendered alongside `<p-table [hidden]="loading()">`. The table is in the DOM with `display:none`. PrimeNG still builds the component, parses templates, and reacts to data updates while hidden. Move the `<p-table>` inside an `@else` branch so the heavy component is not instantiated until data is ready. (Other list pages already do this correctly via `@if (loading()) { ... } @else { <p-table> }`.)

### M9 — `AppConfigurator` eagerly imports Aura + Lara + Nora preset themes

- **File:** `apps/portal/src/app/layout/component/app.configurator.ts:15-17`
- **Function/Component:** `AppConfigurator`
- **Category:** Bundle weight signals
- **Severity:** Medium
- **Why this matters:** Three full preset JSON-CSS theme objects from `@primeuix/themes` are bundled into the configurator. The configurator is in the topbar so this lands in the main authenticated chunk. Users rarely switch themes; the inactive presets are dead weight in the critical path. Dynamic-import the non-default presets on `onPresetChange`.

### M10 — `auth.interceptor.ts` does not deduplicate parallel refresh-token requests

- **File:** `apps/portal/src/app/core/interceptors/auth.interceptor.ts:32-62`
- **Function/Component:** `authInterceptor`
- **Category:** HTTP / Subscription duplication
- **Severity:** Medium
- **Why this matters:** When several requests fire at once (dashboard widgets, list pages with parallel apps + providers fetches), each 401 starts its own `authService.refreshToken()` call. Several refresh requests race to the server, each rotating the refresh token; the loser sees 401 and logs the user out. Fold the refresh into a `shareReplay(1)` observable held on the service and reuse the in-flight token.

### M11 — `LayoutService.theme` computed is inverted

- **File:** `apps/portal/src/app/layout/service/layout.service.ts:70`
- **Function/Component:** `LayoutService.theme`
- **Category:** Functional bug (not perf, but in the audited file)
- **Severity:** Medium
- **Why this matters:** `theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'))` — dark theme returns `'light'`. If anything starts depending on this signal, the wrong theme value will propagate. Flagging because it lives in the most-imported service.

### L1 — `*ngFor track-by` comment refers to deprecated syntax

- **File:** `apps/portal/src/app/core/models/notification-filters.model.ts:35`
- **Function/Component:** Documentation comment only
- **Category:** Lint hygiene
- **Severity:** Low
- **Why this matters:** Stale comment; project no longer uses `*ngFor`. Update to "@for track expression".

### L2 — Inline templates in `app.layout`, `app.topbar`, `app.menu`, `app.menuitem`, `app.floatingconfigurator`, `app.configurator`, `app.sidebar`, `org-selector`, `status-badge`

- **Files:**
  - `apps/portal/src/app/layout/component/app.layout.ts:22-32`
  - `apps/portal/src/app/layout/component/app.topbar.ts:27-92`
  - `apps/portal/src/app/layout/component/app.menu.ts:13-21`
  - `apps/portal/src/app/layout/component/app.menuitem.ts:26-94`
  - `apps/portal/src/app/layout/component/app.floatingconfigurator.ts:11-35`
  - `apps/portal/src/app/layout/component/app.configurator.ts:53-123`
  - `apps/portal/src/app/layout/component/app.sidebar.ts` (small inline)
  - `apps/portal/src/app/shared/components/org-selector/org-selector.ts:11-27`
  - `apps/portal/src/app/shared/components/status-badge/status-badge.ts:9`
- **Function/Component:** Layout shell + a few shared components
- **Category:** Project style deviation
- **Severity:** Low
- **Why this matters:** Project rule mandates separate `.html` / `.scss`. No runtime impact, but inconsistent with the rest of the codebase.

### L3 — `app.layout.ts` uses `@ViewChild` decorator instead of `viewChild()` signal

- **File:** `apps/portal/src/app/layout/component/app.layout.ts:43-45`
- **Function/Component:** `AppLayout`
- **Category:** Project style deviation
- **Severity:** Low
- **Why this matters:** Project mandates `viewChild()` (signal-based). The two `@ViewChild` references appear unused. Drop them.

### L4 — `AppFloatingConfigurator` uses non-readonly DI and non-Angular-style class field name `LayoutService`

- **File:** `apps/portal/src/app/layout/component/app.floatingconfigurator.ts:38`
- **Function/Component:** `AppFloatingConfigurator`
- **Category:** Style hygiene
- **Severity:** Low

### L5 — Many `subscribe(…)` calls without `takeUntilDestroyed()` teardown

- **Files:** see `rg ".subscribe\("` output — list pages, profile, login, layout router events
- **Function/Component:** Most list components
- **Category:** Subscription leak (potential)
- **Severity:** Low
- **Why this matters:** All the HTTP `.subscribe()` calls observe single-emit observables that complete after the response, so they don't leak. The risk is that mid-flight requests still resolve after the user navigates away, which can write to a destroyed component's signal (Angular tolerates this without error, but the work was wasted, and `tap()` side effects on the service signal will set values from a stale request). Adding `takeUntilDestroyed(this.destroyRef)` after a Router navigation cancels in-flight CRUD reloads.

### L6 — `notifications-list.ts:80-88` and `archived-list.ts:86-94` recompute `channelTypeOptions` / `deliveryStatusOptions` as eager class-field arrays

- **Files:**
  - `apps/portal/src/app/features/notifications/pages/notifications-list.ts:80-88`
  - `apps/portal/src/app/features/archived-notifications/pages/archived-list.ts:86-94`
- **Function/Component:** Both notification lists
- **Category:** Minor allocation / duplication
- **Severity:** Low
- **Why this matters:** Two pages independently materialize the same enum-to-options arrays on every component instantiation. Move to a module-level constant or shared util.

### L7 — `dashboard.html:36` uses inline array literal for `@for` track

- **File:** `apps/portal/src/app/pages/dashboard/dashboard.html:36`
- **Function/Component:** Dashboard skeleton loop
- **Category:** Minor allocation
- **Severity:** Low
- **Why this matters:** `@for (i of [1, 2, 3, 4]; track i)` re-allocates the array each CD pass. Move to a class field. Negligible cost, but a common-pattern improvement.

### L8 — `notification-filters.ts:208` uses `setTimeout(... , 0)` to refocus the input

- **File:** `apps/portal/src/app/shared/components/notification-filters/notification-filters.ts:208`
- **Function/Component:** `NotificationFiltersComponent.selectToken`
- **Category:** Init-time blocking / Microtask churn
- **Severity:** Low
- **Why this matters:** Use `afterNextRender(() => searchInputRef()?.nativeElement.focus())` for zoneless-correct timing.

### L9 — Providers list uses client-side `filterGlobal` on server-paginated data, giving the user the illusion of a global search

- **File:** `apps/portal/src/app/features/providers/pages/providers-list.html:40` and `providers-list.ts:200`
- **Function/Component:** `ProvidersListComponent.onGlobalFilter`
- **Category:** Functional / perf misalignment
- **Severity:** Low
- **Why this matters:** `dt.filterGlobal()` only searches the current 20-row page. Same applies to chains and applications list. Either disable the search input or wire it to the backend `?search=` param. Performance side-effect: each keystroke kicks PrimeNG's filter pipeline over the full row template (with all the H1 method calls).

## Top candidates for behavioral test coverage

Pick these to lock in current behavior **before** any perf fix lands. Karma/Jasmine, signal-aware (`fixture.detectChanges()` + `await fixture.whenStable()`):

1. **`NotificationsListComponent.getApplicationName` / `getProviderName`** — pin the `App #<id>` / `Provider #<id>` / `—` fallbacks against missing IDs so a future Map-based rewrite doesn't change output.
2. **`ChainsListComponent.getChainMembers`** — exercise the default object (`members:[], loading:true`) and the loaded-state branches; this is what `@if/@for` in the template reads.
3. **`ChainsListComponent.getAvailableProviders`** — verify it filters by `application_id` AND excludes already-used providers; refactor must preserve.
4. **`ApplicationsListComponent.getAvailableProviders`** — verify per-row exclusion semantics (current row keeps its own providerId, others exclude).
5. **`ApplicationsListComponent.buildWhitelistPayload`** — pin behavior for empty rows, mixed null providers, recipient arrays — directly tied to a H3 fix.
6. **`ApplicationsListComponent` whitelist row mutation** — characterization test asserting that selecting a provider then saving sends the right payload (today's H3 behavior could break under signal-correctness fix).
7. **`OrgContextService.effectiveOrgId` / `isAllOrgsMode`** — drives every page's enable/disable; must stay stable through the H5 fix.
8. **`OrgSelectorComponent.onOrgChange`** — pin the current navigate-and-back behavior (or define new desired behavior) before H5 refactor.
9. **`authInterceptor` 401 → refresh → retry**, plus parallel 401 case — locks H1 of the auth flow and surfaces the H10 race.
10. **`AuthService.refreshToken`** — assert it clears tokens on failure and updates the user signal on success.
11. **`DashboardComponent` analytics null-state** — assert widgets do not initialize charts when `analytics()` is null (drives H2 fix).
12. **`NotificationsService.list`** — verify all filter fields, advancedFilters, and sort/order params map to query string 1:1 (snake_case).
13. **`UsersService.list` / `OrganizationsService.list`** — characterize current "fetch all" behavior so H7 migration to pagination is a controlled break.
14. **`LayoutService.toggleDarkMode` + `theme` signal** — pin current (inverted) behavior of `theme` before fixing M11.
15. **`NotificationFiltersComponent.activeChips`** — covers the computed assembly of chip labels and removal callbacks; this is the user-facing surface of the filter state and likely to be edited.
