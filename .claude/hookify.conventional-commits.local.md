---
name: conventional-commits
enabled: true
event: bash
pattern: git\s+commit
action: warn
---

**Conventional Commits Required**

All commit messages MUST follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

**Format:** `type: subject` or `type(scope): subject`

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `sample`

**Rules:**
- Use imperative present tense ("add feature" not "added feature")
- Do NOT capitalize the first letter after the colon
- Do NOT end with a period
- Max 100 characters total
- Scope is optional but should be lowercase

**Examples:**
- `feat: add WhatsApp provider support`
- `fix(notifications): resolve queue retry logic`
- `docs: update API reference for v1 endpoints`
- `refactor(auth): extract JWT validation to guard`

**WRONG:**
- `Added new feature` (no type, past tense, capitalized)
- `feat: Add provider.` (capitalized, period)
- `update stuff` (no type, vague)
