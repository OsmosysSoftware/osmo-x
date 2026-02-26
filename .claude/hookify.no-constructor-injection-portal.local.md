---
name: no-constructor-injection-portal
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: apps/portal/.*\.ts$
  - field: new_text
    operator: regex_match
    pattern: constructor\s*\((?:private|public|protected|readonly)\s
action: warn
---

**Portal uses `inject()` for dependency injection**

This project's CLAUDE.md requires using `inject()` instead of constructor injection in the Angular portal:

```typescript
// WRONG
constructor(private readonly service: MyService) {}

// CORRECT
private readonly service = inject(MyService);
```

Please refactor to use `inject()` function instead.
