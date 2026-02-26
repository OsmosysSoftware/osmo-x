---
name: code-quality
description: Run lint, format, and build checks across the monorepo. Use when asked to check code quality, fix lint errors, or verify the build passes.
argument-hint: "[api|portal|all]"
allowed-tools: Bash, Read, Grep
---

# Code Quality Check

Run lint, format, and build verification for the specified app(s).

**Target:** `$ARGUMENTS` (defaults to `all` if not specified)

## Steps

### For API (`apps/api`)

```bash
cd apps/api
npm run lint          # ESLint with --max-warnings=0
npm run build         # TypeScript compilation
```

If lint fails, auto-fix:
```bash
npm run lint:fix
npm run format
```

### For Portal (`apps/portal`)

```bash
cd apps/portal
npm run lint          # ESLint with --max-warnings=0
npx ng build          # Angular production build
```

If lint fails, auto-fix:
```bash
npm run lint-fix-format   # Combined: format + lint:fix + format
```

## Rules

- **Zero warnings policy**: Both apps enforce `--max-warnings=0`
- **No `any` types**: `@typescript-eslint/no-explicit-any: error` in both apps
- **Prettier formatting**: Runs via lint-staged on commit, but can be run manually
- Always fix issues before committing — never skip pre-commit hooks
