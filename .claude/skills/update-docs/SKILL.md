---
name: update-docs
description: Sync source markdown docs to the Mintlify documentation site. Use when source docs in apps/api/docs/ are added or updated, or when creating new docs-site pages.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Update Mintlify Documentation Site

Sync changes from source documentation (`apps/api/docs/`) to the Mintlify docs site (`apps/api/docs-site/`), or create new MDX pages.

## Arguments

`$ARGUMENTS` can be:
- A file path (e.g., `apps/api/docs/webhook-guide.md`) — sync that specific doc
- A topic name (e.g., `webhooks`, `production setup`) — find and sync matching docs
- Empty — check for recently modified source docs and sync all of them

## Step 1: Identify Source Files

If a file path or topic is provided, locate the matching source file(s) in `apps/api/docs/`.

If no argument, check `git diff --name-only HEAD~1` and `git status` for recently changed `.md` files under `apps/api/docs/`.

## Step 2: Read Reference MDX Pages

Read 2-3 existing MDX pages from `apps/api/docs-site/` to understand the established style:
- `apps/api/docs-site/introduction.mdx` — landing page with Cards
- `apps/api/docs-site/getting-started/development.mdx` — guide with CardGroup, Steps, code blocks
- `apps/api/docs-site/guides/webhooks.mdx` — feature guide with Notes

Also read `apps/api/docs-site/mint.json` for the current navigation structure.

## Step 3: Determine Mapping

Map source docs to their docs-site counterparts:

| Source (`apps/api/docs/`) | Docs Site (`apps/api/docs-site/`) |
|---------------------------|-----------------------------------|
| `development-setup.md` | `getting-started/development.mdx` |
| `production-setup.md` | `getting-started/production.mdx` |
| `database-design.md` | `getting-started/database.mdx` |
| `block-diagram.md` | `getting-started/architecture.mdx` |
| `api-documentation.md` | `api-reference/overview.mdx` |
| `usage-guide.md` | `api-reference/usage.mdx` |
| `channels/smtp.md` | `channels/email/smtp.mdx` |
| `channels/mailgun.md` | `channels/email/mailgun.mdx` |
| `channels/aws-ses.md` | `channels/email/aws-ses.mdx` |
| `channels/sms-Twilio.md` | `channels/sms/twilio.mdx` |
| `channels/sms-Plivo.md` | `channels/sms/plivo.mdx` |
| `channels/sms-sns.md` | `channels/sms/aws-sns.mdx` |
| `channels/wa-Twilio.md` | `channels/whatsapp/twilio.mdx` |
| `channels/wa-Twilio-Business.md` | `channels/whatsapp/twilio-business.mdx` |
| `channels/wa-360Dialog.md` | `channels/whatsapp/360dialog.mdx` |
| `channels/push-sns.md` | `channels/push/aws-sns.mdx` |
| `channels/vc-twilio.md` | `channels/voice/twilio.mdx` |
| `webhook-guide.md` | `guides/webhooks.mdx` |
| `test-mode-guide.md` | `guides/test-mode.mdx` |
| `add-new-provider.md` | `guides/add-provider.mdx` |
| `delivery-status-lifecycle.md` | `guides/delivery-status.mdx` |
| `redis-cleanup-guide.md` | `operations/redis-cleanup.mdx` |
| `sns-usage-guide.md` | `operations/aws-sns.mdx` |
| `docker-compose-usage.md` | `operations/docker.mdx` |
| `reference/ERROR_CODES.md` | `api-reference/error-codes.mdx` |

If a source doc has no mapping, create a new MDX page in the most appropriate directory.

## Step 4: Convert/Update MDX

For each source file, read the source markdown and the existing MDX (if any), then update the MDX:

### MDX Format Rules

1. **Frontmatter** — every page must have:
   ```yaml
   ---
   title: Page Title
   description: Brief one-line description
   icon: fontawesome-icon-name  # optional
   ---
   ```

2. **Mintlify Components** — use where they improve readability:
   - `<CardGroup cols={2}>` + `<Card>` — for feature lists, prerequisites, options
   - `<Steps>` + `<Step>` — for sequential setup/configuration steps
   - `<Note>` — for important callouts
   - `<Warning>` — for critical warnings (data loss, security)
   - `<Tip>` — for helpful suggestions
   - `<Tabs>` + `<Tab>` — for alternative approaches (Docker vs manual, etc.)
   - `<CodeGroup>` — for showing same code in multiple languages
   - `<Accordion>` + `<AccordionGroup>` — for collapsible details

3. **Code blocks** — use triple backticks with language identifier (```bash, ```json, ```typescript)

4. **Images** — reference from `/images/` path (relative to docs-site root)

5. **Cross-references** — use relative paths like `/getting-started/development`

### What NOT to do
- Don't wrap every paragraph in a component — use plain markdown for body text
- Don't add components that don't improve the content (e.g., don't wrap a single paragraph in a Note)
- Don't change technical accuracy — preserve all commands, config values, and code exactly

## Step 5: Update Navigation

If creating a new page, add it to the appropriate `navigation` group in `apps/api/docs-site/mint.json`.

The path in mint.json is relative to docs-site root without the `.mdx` extension:
```json
"pages": ["guides/webhooks", "guides/new-page"]
```

## Step 6: Validate

Run a quick validation:
```bash
# Check all pages in mint.json exist on disk
cd apps/api/docs-site
cat mint.json | python3 -c "
import json, sys, os
config = json.load(sys.stdin)
missing = []
for group in config['navigation']:
    for page in group['pages']:
        if not os.path.exists(f'{page}.mdx'):
            missing.append(page)
if missing:
    print('Missing pages:')
    for p in missing:
        print(f'  - {p}.mdx')
    sys.exit(1)
else:
    print('All pages in mint.json exist')
"
```

Report which files were created or updated.
