---
name: commit
description: Create a git commit following project conventions. Use when asked to commit changes.
argument-hint: "[optional commit message override]"
allowed-tools: Bash, Read, Grep
---

# Commit Changes

Create git commits following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

## Commit Message Format

```text
<type>[optional scope]: <description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scope**: `api`, `portal`, or omit for cross-cutting changes that span both apps as part of the same feature

**Description** (first line):
- Imperative present tense ("add" not "added")
- Lowercase — no capitalization of first word
- No period at end
- Be specific and descriptive — capture enough context so the commit is self-explanatory

**Body** (optional, after blank line):
- Use when the description alone isn't enough to explain the change
- Explain *what* and *why*, not *how*

**Forbidden:**
- **No `Co-Authored-By`, `Signed-off-by`, or AI attribution lines — ever**

**Examples:**
```
feat(api): add WhatsApp provider support
fix(portal): prevent duplicate form submission on login
refactor(api): extract org resolution into shared utility
feat: add SUPER_ADMIN org context switching across all controllers and portal

feat(api): add provider chain CRUD endpoints

Adds create, update, soft-delete, and restore endpoints
for provider chain members with org-scoped access control.
```

## Steps

1. Run `git status` and `git diff --stat` to review all changes
2. If `$ARGUMENTS` is provided, use it as the commit message (still validate format)
3. Otherwise, analyze the diff and **group changes by nature**:
   - Each commit must be a **single logical unit** — one concern per commit
   - **Split** when changes span different concerns:
     - Bug fixes vs new features
     - Refactors vs functional changes
     - Database migrations vs application code
     - Unrelated API changes vs unrelated portal changes
   - **Keep together** when changes serve the same purpose (e.g. a feature that touches both API and portal)
4. For each commit group:
   a. Draft a message following the format above
   b. Stage only the relevant files (prefer specific files over `git add -A`)
   c. Commit using a HEREDOC:
      ```bash
      git commit -m "$(cat <<'EOF'
      <type>(<scope>): <description>
      EOF
      )"
      ```
5. Run `git status` to verify success

## Important

- Never include attribution lines (Co-Authored-By, Signed-off-by, noreply@anthropic)
- Never skip pre-commit hooks (`--no-verify`)
- If hooks fail, fix the issue and create a NEW commit (don't amend)
- Don't push unless explicitly asked
