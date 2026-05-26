# Verified Performance & Correctness Findings — 2026-05-26

**Scope:** Subset of the findings from `2026-05-26-api-perf.md` and `2026-05-26-portal-perf.md` that were re-checked against the actual source code on this branch.

**Method:** Each item below was opened in the cited file at the cited line and the claim was checked against what the code actually does. Items are listed in approximate order of impact, not original audit numbering.

**Legend:** ✅ VERIFIED — claim matches code exactly. ⚠️ VERIFIED with nuance — core claim correct, one detail clarified.

---

## Correctness bugs (not perf, but real)

### 1. `LayoutService.theme` returns inverted values ✅

**File:** `apps/portal/src/app/layout/service/layout.service.ts:70`

```typescript
theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'));
```

When `darkTheme` is `true`, `theme()` returns `'light'`. When `false`, returns `'dark'`. The most-imported service in the layout shell. Whoever consumes `theme()` either silently works around this or renders wrong.

---

### 2. `ProviderChainMembersService.getNextPriorityProvider` silently swallows errors ✅

**File:** `apps/api/src/modules/provider-chain-members/provider-chain-members.service.ts:579-624` (FIXME at `:621`)

```typescript
} catch (error) {
  // FIXME: Temporary logic of returning null to avoid throwing uncaught errors
  return null;
}
```

A FIXME is already in the source. If the next-provider lookup throws, the consumer treats it as "no next provider" and fails over to nothing. Real DB errors get hidden.

---

### 3. Applications-list whitelist editor mutates signal-backed objects directly ✅

**File:** `apps/portal/src/app/features/applications/pages/applications-list.html:181-198`

```html
<p-select
  [ngModel]="row.providerId"
  (ngModelChange)="row.providerId = $event"
  ...
/>
<p-autocomplete
  [(ngModel)]="row.recipients"
  ...
/>
```

Two violations of the zoneless mandate documented in `apps/portal/CLAUDE.md`:

- `[(ngModel)]="row.recipients"` — banned ("NEVER use `[(ngModel)]` with signals")
- `(ngModelChange)="row.providerId = $event"` — direct mutation of a signal-backed object (banned)

Can produce stale views or silently submit stale payloads in zoneless mode.

---

## Performance issues with smoking-gun evidence

### 4. `WebhookService.triggerWebhook` blocks a Bull worker for ~62 seconds on a dead webhook ✅

**File:** `apps/api/src/modules/webhook/webhook.service.ts:58-99`

```typescript
async triggerWebhook(id: number): Promise<void> {
  const maxRetries = 5;
  let attempts = 0;
  const notification = (await this.notificationsService.getNotificationById(id))[0];

  while (attempts < maxRetries) {
    try {
      const webhook = await this.webhookRepository.findOneBy({ ... });  // re-queried every attempt
      ...
      const response = await axios.post(webhook.webhookUrl, notification, { ... });
      return;
    } catch (error) {
      attempts++;
      ...
      const waitTime = Math.pow(2, attempts) * 1000;  // 2s, 4s, 8s, 16s, 32s
      await this.sleep(waitTime);
    }
  }
}
```

Cumulative sleep on a dead receiver: 2 + 4 + 8 + 16 + 32 = **62 seconds**, all running inside the Bull worker. With default concurrency 5, five dead receivers stall the channel. `notify_webhooks` is also re-queried on every attempt instead of once.

⚠️ Nuance: line 93 logs `attempts * 1000` (looks linear) but the actual sleep at line 94 uses `Math.pow(2, attempts) * 1000` (exponential). The log line is misleading; the sleep behavior matches the audit claim.

---

### 5. `NotificationsService.addNotificationsToQueue` loads pending rows unbounded and re-saves each row at least twice ✅

**Files:**
- `apps/api/src/modules/notifications/notifications.service.ts:475-483` — `getPendingNotifications` unbounded find
- `apps/api/src/modules/notifications/notifications.service.ts:333-394` — the loop

```typescript
getPendingNotifications(): Promise<Notification[]> {
  return this.notificationRepository.find({
    where: { deliveryStatus: DeliveryStatus.PENDING, status: Status.ACTIVE },
  });  // no take, no skip, no batch
}

// Inside the loop:
notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
await this.notificationRepository.save(notification);  // save #1, line 373
await this.notificationQueueService.addNotificationToQueue(QueueAction.SEND, notification);
...
} finally {
  await this.notificationRepository.save(notification);  // save #2, line 392 — runs ALWAYS
}
```

⚠️ Nuance: original audit framing said "triple-write" — that's accurate for the **error path** (the `catch` block at `:383` calls `createRetryEntry` which adds writes). For the **success path** every row is saved **twice** unconditionally. Both numbers are high cost per cron tick at large backlog.

---

### 6. Every Bull job re-instantiates the provider SDK client ✅

**Files:** AWS SES is the clearest example — `apps/api/src/modules/providers/aws-ses/aws-ses.service.ts:34-44, 53-59`

```typescript
private async getSesClient(providerId: number): Promise<aws.SES> {
  const config = await this.providersService.getConfigById(providerId);  // DB read per job
  return new aws.SES({                                                    // new SDK client per job
    apiVersion: '2010-12-01',
    region: config.AWS_REGION as string,
    credentials: { ... },
  });
}

async sendAwsSes(...) {
  const ses = await this.getSesClient(providerId);
  const transporter = nodemailer.createTransport({ SES: { ses, aws }, ... });  // new transporter per job
  ...
}
```

Same pattern across the SMTP, Mailgun, Twilio SMS / WA / Voice, Plivo, SNS, 360Dialog services per audit H1. No connection pool warms up, no SDK-internal HTTP keep-alive is reused, plus an extra DB round-trip for the provider config every send.

---

### 7. Consumer fetches the same notification 2× per Bull job ✅

**Files:**
- `apps/api/src/jobs/consumers/notifications/notification.consumer.ts:55` — base consumer fetch
- `apps/api/src/jobs/consumers/notifications/smtp-notifications.job.consumer.ts` — channel consumer also fetches

Base consumer:
```typescript
const notification = (await this.notificationsService.getNotificationById(id))[0];
```

SMTP channel consumer:
```typescript
async processSmtpNotificationQueue(id: number): Promise<void> {
  return super.processNotificationQueue(id, async () => {
    const notification = (await this.notificationsService.getNotificationById(id))[0];  // fetch #2
    return this.smtpService.sendEmail(...);
  });
}
```

Every send pulls the notification row twice. Confirmation flow has its own equivalent. (`getNotificationById` itself returns an array of one — a `TODO` comment at line 495 already notes the awkward shape.)

---

### 8. `SnakeCaseInterceptor` does un-memoized recursive key conversion on every v1 response ✅

**File:** `apps/api/src/common/interceptors/snake-case.interceptor.ts:56-118`

```typescript
private transformToSnakeCase(obj: unknown, seen = new WeakSet()): unknown {
  ...
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const transformedKey = this.shouldPreserveKey(key) ? key : this.toSnakeCase(key);
    ...
  }
}
```

Allocates a fresh `WeakSet` per call, runs `Object.entries` per object, calls regex-based `toSnakeCase` on every key. No memoization of the camel↔snake key map. Runs on every paginated list response.

---

### 9. List pages do `Array.find` per row for name lookups ✅

**File:** `apps/portal/src/app/features/notifications/pages/notifications-list.ts:315-326` (representative — pattern repeats across ~9 components)

```typescript
getApplicationName(applicationId: number): string {
  const app = this.applications().find((a) => a.application_id === applicationId);
  ...
}

getProviderName(providerId: number | null): string {
  ...
  const provider = this.providers().find((p) => p.provider_id === providerId);
  ...
}
```

Called once per row in the template. For an N-row table over an M-item cache, that's N × M comparisons per change-detection cycle. Same pattern in archived-notifications, providers-list, chains-list, api-keys, webhooks, users-list, applications-list, provider-health widget.

---

### 10. `CoreService.findAll` left-joins related entities unconditionally on every list query ✅

**File:** `apps/api/src/common/graphql/services/core.service.ts:48-75`

```typescript
if (alias === 'notification' || alias === 'archivedNotification') {
  queryBuilder.leftJoinAndSelect(`${alias}.applicationDetails`, 'application', ...);
} else if (alias === 'providerChain') {
  queryBuilder.leftJoinAndSelect(`${alias}.applicationDetails`, 'application', ...);
} else if (alias === 'providerChainMember') {
  queryBuilder.leftJoinAndSelect(`${alias}.providerDetails`, 'provider', ...);
  queryBuilder.leftJoinAndSelect(`${alias}.providerChainDetails`, 'provider-chain', ...);
}
```

The joins are hard-coded by alias and always run — REST endpoints that map to flat DTOs not using the joined rows still pay for full row hydration. Originally added for GraphQL field-level resolution; now leaks across to all `findAll` consumers (Notifications, Archived, Providers, ProviderChains, ProviderChainMembers).

---

## Smaller verified items

### 11. Dashboard widgets get a fresh `[]` literal on every CD cycle when `analytics()` is null ✅

**File:** `apps/portal/src/app/pages/dashboard/dashboard.html:157, 161, 168, 175`

```html
<app-notification-trends-widget [data]="analytics()?.trends ?? []" ... />
<app-channel-breakdown-widget [data]="analytics()?.channel_breakdown ?? []" ... />
<app-application-stats-widget [data]="analytics()?.application_stats ?? []" ... />
<app-provider-health-widget [data]="analytics()?.provider_stats ?? []" ... />
```

Each `?? []` produces a new array reference on every CD pass. Combined with the widgets' own effects scheduling chart-init via `setTimeout(150)`, this thrashes the chart-init pipeline whenever the parent re-renders before analytics resolves.

---

### 12. `OrgSelectorComponent.onOrgChange` does a navigate-and-back bounce ✅

**File:** `apps/portal/src/app/shared/components/org-selector/org-selector.ts:37-46`

```typescript
onOrgChange(orgId: number | null): void {
  this.orgContext.selectOrg(orgId);

  const currentUrl = this.router.url;

  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigateByUrl(currentUrl);
  });
}
```

The active feature route is torn down and reconstructed on every org switch. `skipLocationChange: true` keeps the URL stable but the component lifecycle still fires twice. Any non-signal page state is lost.

---

## Findings I did NOT verify here

The reports list 27 + 32 = 59 findings total. The 12 above are the ones I opened in code and confirmed line by line. The rest — most medium / low severity items — are still in the original audit documents but were not re-checked in this pass. If you want any of those independently verified before acting, ask and I'll do another pass.

## Out of scope for this audit

- No profiler data. Static analysis cannot rank by actual wall-clock impact. Items 4 (webhook block) and 5 (queue write amplification) are likely the highest-impact under load, but that's a hypothesis that should be confirmed with a profiler before optimising.
- No fixes proposed. The audit is a backlog; the fixes are separate PRs that will use the test files in this same PR as their regression safety net.
