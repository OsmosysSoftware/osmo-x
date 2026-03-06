---
name: require-build-before-stop
enabled: true
event: stop
pattern: .*
action: warn
---

**Before stopping, verify:**

- Did you run `npm run build` in the affected app(s)?
- Did you run `npm run lint` in the affected app(s)?
- Are there uncommitted changes that should be committed?
- Did you reload CLAUDE.md files if context was compacted?

Always verify build + lint pass before considering work complete.
