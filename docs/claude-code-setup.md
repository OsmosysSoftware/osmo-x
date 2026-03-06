# Claude Code Setup for OsmoX

This document explains all the Claude Code customizations configured for the OsmoX project — what they do, why they exist, and how to modify them.

---

## Overview

Claude Code is customized using seven features, each with a different purpose and context window impact:

| Feature | Purpose | Context Impact | Location |
|---------|---------|----------------|----------|
| **CLAUDE.md** | Always-on coding standards | High (loaded every session) | Root + each app |
| **Skills** | On-demand task workflows | Low (loaded only when invoked) | `.claude/skills/` |
| **Hooks (Hookify)** | Automatic guard rails | Zero (runs outside context) | `.claude/hookify.*.local.md` |
| **Memory** | Cross-session knowledge | Low (summary file loaded) | `~/.claude/projects/.../memory/` |
| **MCP Servers** | External tool integrations | Moderate (tools loaded on demand) | User/project settings |
| **Plugins** | Bundled skills, hooks, agents, and MCP servers | Varies (loaded on demand) | `~/.claude/settings.json` |
| **Settings** | Tool permissions and allowed commands | Zero (config only) | `.claude/settings.local.json` |

---

## 1. CLAUDE.md Files (Always-On Instructions)

These are loaded into every Claude Code session. They define non-negotiable standards.

### Root: `CLAUDE.md`

**What it covers:**
- Project overview (monorepo structure, what OsmoX is)
- Development commands for both apps (`npm run build`, `npm run lint`, etc.)
- Architecture overview (data flow, module structure, entity hierarchy)
- Code style rules for both API and Portal
- Commit message convention (conventional commits)
- Key concepts (provider chains, test mode, notification statuses)

**When to update:** After architectural decisions, adding new modules, or changing conventions.

### API: `apps/api/CLAUDE.md`

**What it covers:**
- Critical instructions: Use Context7 MCP for docs, use NestJS CLI for generation
- NestJS 11 + TypeORM patterns (entity structure, naming conventions, migrations)
- JWT authentication flow (access + refresh tokens)
- Role system (ORG_USER, ORG_ADMIN, SUPER_ADMIN)
- API design patterns (v1 endpoints, RFC 7807 errors, snake_case responses)
- DTO patterns, pagination, error handling
- Response DTO guidelines (never return entities directly)
- Docker Compose services
- Reference to interview-app backend patterns

### Portal: `apps/portal/CLAUDE.md`

**What it covers:**
- Critical instructions: Use Context7 MCP for Angular/PrimeNG docs
- Zoneless architecture requirements (NO Zone.js, signals mandatory)
- Angular 20 component pattern (standalone, OnPush, inject(), input()/output())
- Modern template syntax (@if, @for, @switch)
- API type system (openapi-typescript, snake_case, NO conversion)
- PrimeNG v20 integration patterns
- Auth implementation (signal-based)
- Reference to interview-app frontend patterns

---

## 2. Skills (On-Demand Workflows)

Skills are invoked manually with `/skill-name` or automatically when Claude detects a matching request. They consume context only when active.

### Available Skills

#### Project Skills (`.claude/skills/`)

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `/commit` | "commit changes" | Creates git commits following conventional commits format |
| `/code-quality [api\|portal\|all]` | "run lint", "check build", "fix formatting" | Runs lint + build verification for specified app(s) |
| `/crud-page [name]` | "create a new page", "add feature page" | Interactive generator for CRUD or read-only list pages — asks about page type, role guard, menu placement, API integration, fields, and pagination |
| `/generate-api-types` | "regenerate types", "update API types" | Runs `openapi-typescript` to regenerate portal types from backend Swagger |
| `/db-migration [action] [name]` | "create migration", "run migrations" | Creates, runs, or reverts TypeORM database migrations |
| `/add-provider` | "add a new provider" | Scaffolds a new notification provider (email, SMS, WhatsApp, push, voice) with service, consumer, queue wiring, and master provider seed |
| `/update-docs [file]` | "sync docs", "update docs site" | Syncs source markdown docs to the Mintlify documentation site |

#### Plugin-Provided Skills

These come from installed plugins (see [Section 6: Plugins](#6-plugins-bundled-extensions)) and are available globally:

| Skill | Plugin | What It Does |
|-------|--------|--------------|
| `/code-review` | code-review | Reviews a pull request for quality, bugs, and style |
| `/frontend-design` | frontend-design | Creates production-grade frontend interfaces with high design quality |
| `/hookify` | hookify | Creates hookify rules from conversation analysis or explicit instructions |
| `/find-skills` | (global skill) | Discovers and installs skills from the open agent skills ecosystem |
| `/simplify` | (global skill) | Reviews changed code for reuse, quality, and efficiency |
| `/claude-code-setup` | claude-code-setup | Analyzes codebase and recommends Claude Code automations |
| `/webapp-testing` | document-skills | Tests local web applications using Playwright |
| `/pdf`, `/docx`, `/xlsx`, `/pptx` | document-skills | Create and manipulate documents and spreadsheets |

### Skill Files Location

```
.claude/skills/
├── add-provider/SKILL.md
├── commit/SKILL.md
├── code-quality/SKILL.md
├── crud-page/SKILL.md
├── generate-api-types/SKILL.md
├── db-migration/SKILL.md
└── update-docs/SKILL.md
```

### Creating New Skills

Create a directory under `.claude/skills/` with a `SKILL.md` file:

```yaml
---
name: my-skill
description: When to use this skill. Claude matches on this text.
argument-hint: "[optional args]"
disable-model-invocation: true    # Only manual /my-skill invocation
allowed-tools: Bash, Read, Grep   # Restrict available tools
---

# Instructions here
Markdown content Claude follows when the skill is invoked.
Use $ARGUMENTS to access user-provided arguments.
```

---

## 3. Hookify Rules (Automatic Guard Rails)

Hookify rules run automatically on specific events (file edits, bash commands, stopping). They have **zero context impact** — they execute outside Claude's context window.

### Active Rules

| Rule | Event | Action | Purpose |
|------|-------|--------|---------|
| `conventional-commits` | `bash` (git commit) | warn | Reminds to use conventional commit format |
| `no-attribution` | `bash` (git commit) | **block** | Blocks commits with Co-Authored-By or AI attribution |
| `no-ngif-ngfor` | `file` (portal .ts/.html) | **block** | Blocks old Angular `*ngIf`/`*ngFor` syntax |
| `no-constructor-injection-portal` | `file` (portal .ts) | warn | Warns about constructor DI (should use `inject()`) |
| `no-any-type` | `file` (api/portal .ts) | warn | Warns about explicit `any` type usage |
| `warn-env-secrets` | `file` (.env) | warn | Warns when writing secrets to .env files |
| `require-build-before-stop` | `stop` | warn | Reminds to verify build/lint before ending session |
| `sync-docs-site` | `file` (docs/) | warn | Reminds to sync docs-site when source docs are modified |

Additionally, the **security-guidance** plugin provides a system-level hook that warns about potential security issues (command injection, XSS, unsafe patterns) when editing files.

### Rule Files Location

```
.claude/
├── hookify.conventional-commits.local.md
├── hookify.no-attribution.local.md
├── hookify.no-ngif-ngfor.local.md
├── hookify.no-constructor-injection-portal.local.md
├── hookify.no-any-type.local.md
├── hookify.warn-env-secrets.local.md
├── hookify.require-build-before-stop.local.md
└── hookify.sync-docs-site.local.md
```

### Rule Actions

- **`warn`**: Shows the message but allows the operation to proceed
- **`block`**: Prevents the operation entirely (Claude must fix the issue first)

### Modifying Rules

Edit the `.local.md` file directly. Changes take effect immediately (no restart needed).

To temporarily disable a rule, set `enabled: false` in the frontmatter:

```yaml
---
name: rule-name
enabled: false    # Disabled
event: bash
pattern: ...
---
```

### Creating New Rules

```yaml
---
name: descriptive-name
enabled: true
event: bash|file|stop|prompt|all
pattern: regex-pattern
action: warn|block
---

Message shown when the rule triggers.
```

For advanced multi-condition rules:

```yaml
---
name: rule-name
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$
  - field: new_text
    operator: contains
    pattern: SECRET
---
```

---

## 4. Memory (Cross-Session Knowledge)

Claude Code maintains persistent memory across conversations. The main file (`MEMORY.md`) is loaded at session start.

### Location

```
~/.claude/projects/-home-vikas-work-osmosys-osmo-x/memory/
├── MEMORY.md                    # Always loaded (keep under 200 lines)
├── interview-app-patterns.md    # Detailed reference patterns
└── ... (other topic files)
```

### What's Stored

- Project status (which phases are complete)
- Key architecture decisions
- User preferences (e.g., "always reload CLAUDE.md after compaction")
- Entity hierarchy and role system
- Important file paths

### When It Updates

Claude updates memory automatically when:
- A stable pattern is confirmed across interactions
- The user asks to remember something
- Architectural decisions are made

---

## 5. MCP Servers (External Integrations)

MCP (Model Context Protocol) servers connect Claude to external tools and services.

### Configured Servers

| Server | Source | Purpose |
|--------|--------|---------|
| **Context7** | Plugin | Fetches latest documentation for libraries (Angular, NestJS, TypeORM, etc.) |
| **PrimeNG** | User-level | PrimeNG v20 component docs — props, events, templates, methods, theming, pass through |
| **Serena** | Plugin | Semantic code navigation — symbol search, find references, overview of files |
| **GitHub** | Plugin | GitHub repository management — issues, PRs, code review, actions |
| **Chrome DevTools** | User-level | Browser debugging, screenshots, performance analysis, and network inspection |
| **Joplin** | User-level | Note-taking integration |

### How They Work

MCP tools are loaded on demand when Claude determines they're needed. For example:

- Before using a PrimeNG component, Claude uses the PrimeNG MCP to fetch props, events, and usage examples
- Before implementing a NestJS pattern, Claude uses Context7 to fetch current docs
- When exploring code structure, Claude uses Serena's `find_symbol` / `get_symbols_overview`
- When testing the portal UI, Claude can use Chrome DevTools to take screenshots and inspect network requests

### Configuration

MCP servers are configured at different levels:

| Level | Config File | Scope |
|-------|-------------|-------|
| **Plugin** | Managed by plugin | Available when plugin is enabled |
| **User** | `~/.claude/settings.json` | Available in all projects |
| **Project** | `.mcp.json` (repo root) | Shared with team via git |

**Adding a new MCP server:**

```bash
# Add at user level (available in all projects)
claude mcp add <name> -s user -- <command>

# Add at project level (shared with team via .mcp.json)
claude mcp add <name> -- <command>
```

### Recommended MCP Servers

| Server | Install Command | Why |
|--------|----------------|-----|
| **PostgreSQL** | `claude mcp add postgres -s user -- npx -y @anthropic/mcp-postgres@latest <connection-string>` | Inspect schemas, verify migrations, debug tenant scoping directly |

---

## 6. Plugins (Bundled Extensions)

Plugins are collections of skills, hooks, agents, and MCP servers installed at the user level. They provide capabilities across all projects.

### Installed Plugins

| Plugin | Source | What It Provides |
|--------|--------|-----------------|
| **context7** | claude-plugins-official | MCP server for live library documentation lookup |
| **serena** | claude-plugins-official | MCP server for semantic code navigation (symbol search, references) |
| **code-review** | claude-plugins-official | `/code-review` skill for PR reviews |
| **frontend-design** | claude-plugins-official | `/frontend-design` skill for production-grade UI |
| **hookify** | claude-plugins-official | `/hookify` skill + conversation analyzer agent for creating guard rail rules |
| **security-guidance** | claude-plugins-official | Security reminder hook (warns about injection, XSS, unsafe patterns) |
| **claude-code-setup** | claude-plugins-official | `/claude-code-setup` skill for automation recommendations |
| **github** | claude-plugins-official | MCP server for GitHub — issues, PRs, code review, repository management |
| **document-skills** | anthropic-agent-skills | Skills for PDF, DOCX, XLSX, PPTX, webapp testing, and more |
| **pyright-lsp** | claude-plugins-official | Python type checking via LSP |

### Managing Plugins

```bash
# List installed plugins
claude /plugin

# Reload plugins after changes
claude /reload-plugins

# Enable/disable in ~/.claude/settings.json under "enabledPlugins"
```

---

## 7. Settings (`settings.local.json`)

The `.claude/settings.local.json` file configures tool permissions — which bash commands and tools Claude can use without asking for approval each time.

### Key Permissions

- **Build/lint commands**: `npm run build`, `npm run lint`, `npm run lint:fix`
- **Git operations**: `git commit`, `git add`, `git log`
- **Angular CLI**: `npx ng build`
- **NestJS CLI**: `npx nest g ...`
- **TypeORM**: `npm run typeorm:*`
- **MCP tools**: Serena (code navigation), Context7 (docs)

### Modifying Permissions

Edit `.claude/settings.local.json` to add new allowed commands. Format:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run test)",
      "Bash(docker compose up -d)"
    ]
  }
}
```

---

## Quick Reference

### For Developers

| I want to... | Use |
|---------------|-----|
| Check coding standards | Read `CLAUDE.md` in the relevant app |
| Run code quality checks | `/code-quality api` or `/code-quality portal` |
| Regenerate API types | `/generate-api-types` |
| Create a new feature page | `/crud-page my-feature` |
| Add a notification provider | `/add-provider` |
| Manage database migrations | `/db-migration create AddNewTable` |
| Sync docs to docs-site | `/update-docs [file or topic]` |
| Review a pull request | `/code-review` |
| Get automation recommendations | `/claude-code-setup` |
| Find and install new skills | `/find-skills [query]` |
| Disable a hookify rule | Set `enabled: false` in the rule's `.local.md` file |
| Add a new hookify rule | `/hookify` or create `.claude/hookify.rule-name.local.md` |
| Add a new skill | Create `.claude/skills/skill-name/SKILL.md` |
| Update always-on instructions | Edit `CLAUDE.md` in root or app directory |
| Persist knowledge across sessions | Claude updates `~/.claude/projects/.../memory/MEMORY.md` |

### Decision Matrix

- Claude should **always** know it → Put in `CLAUDE.md`
- Claude should know it **sometimes** → Create a **Skill**
- Something must happen **automatically** → Create a **Hookify rule**
- Complex research in **isolation** → Use a **Sub Agent** (Task tool)
- Need **external tools/data** → Connect an **MCP Server**
- Need a bundle of related capabilities → Install a **Plugin**
