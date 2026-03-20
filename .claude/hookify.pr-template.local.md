---
name: pr-template
enabled: true
event: bash
conditions:
  - field: command
    operator: regex_match
    pattern: gh\s+pr\s+create
action: warn
---

**PR Template Required**

All pull requests MUST use the appropriate PR template from `.github/PULL_REQUEST_TEMPLATE/`.

**Choose based on changes:**
- **API only** → Use `pull_request_template_api.md` template sections
- **Portal only** → Use `pull_request_template_portal.md` template sections
- **Both API + Portal** → Combine both template checklists

**Required sections:**
1. **Task Link** — Link to the GitHub issue (e.g., `[#123](issue-url)`)
2. **Pre-requisites checklist** — Check applicable items
3. **PR Details checklist** — Check applicable items
4. **Description** — Brief summary of changes
5. **Related changes** — Bullet points of file changes
6. **Screenshots** — Required for Portal changes (use Chrome DevTools)

**API-specific sections:**
- Query request and response examples
- Documentation changes
- Test suite/unit testing output

Ensure the PR body includes the full template structure before creating.
