---
name: commit
description: Create a git commit following project conventions. Use when asked to commit changes.
argument-hint: "[optional commit message override]"
allowed-tools: Bash, Read, Grep
---

# Commit Changes

Create a git commit following the project's conventional commit format.

## Commit Message Format

```text
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `sample`

**Scope** (optional): `api`, `portal`, or omit for cross-cutting changes

**Rules:**
- Imperative present tense ("add" not "added")
- No capitalization of subject
- No period at end
- Max 100 characters
- **No `Co-Authored-By`, `Signed-off-by`, or AI attribution lines**

**Example:** `feat(api): add WhatsApp provider support`

## Steps

1. Run `git status` and `git diff --stat` to review changes
2. If `$ARGUMENTS` is provided, use it as the commit message (still validate format)
3. Otherwise, analyze the diff and draft a message following the format above
4. Stage relevant files (prefer specific files over `git add -A`)
5. Commit using a HEREDOC:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>: <subject>
   EOF
   )"
   ```
6. Run `git status` to verify success

## Important

- Never include attribution lines (Co-Authored-By, Signed-off-by, noreply@anthropic)
- Never skip pre-commit hooks (`--no-verify`)
- If hooks fail, fix the issue and create a NEW commit (don't amend)
- Don't push unless explicitly asked
