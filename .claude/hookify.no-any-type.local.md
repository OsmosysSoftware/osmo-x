---
name: no-any-type
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: apps/(?:api|portal)/.*\.ts$
  - field: new_text
    operator: regex_match
    pattern: :\s*any\b|<any>|as\s+any\b
action: warn
---

**Explicit `any` type detected**

Both `apps/api` and `apps/portal` have `@typescript-eslint/no-explicit-any: error` configured. Avoid using `any` — use proper types instead:

- Use `unknown` when the type is truly unknown
- Use `Record<string, unknown>` for generic objects
- Use specific interfaces or type aliases
- Use generics where appropriate
