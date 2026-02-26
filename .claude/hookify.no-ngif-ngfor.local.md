---
name: no-ngif-ngfor
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: apps/portal/.*\.(?:ts|html)$
  - field: new_text
    operator: regex_match
    pattern: \*ngIf|\*ngFor|\*ngSwitch
action: block
---

**BLOCKED: Old Angular control flow syntax detected in portal code**

This project uses Angular 20 modern control flow. You MUST use:

- `@if` instead of `*ngIf`
- `@for` instead of `*ngFor`
- `@switch` instead of `*ngSwitch`

Replace the old directives with block syntax before proceeding.
