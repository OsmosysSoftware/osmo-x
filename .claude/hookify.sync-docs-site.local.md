---
name: sync-docs-site
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: apps/api/docs/.*\.md$
action: warn
---

**Source documentation modified — Mintlify docs site may need updating**

The file you just modified has a corresponding page in `apps/api/docs-site/`. Run `/update-docs` to sync the changes to the Mintlify documentation site, or manually update the matching MDX page.

See the mapping in `.claude/skills/update-docs/SKILL.md` (Step 3) for source → docs-site file mapping.
