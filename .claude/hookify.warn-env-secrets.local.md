---
name: warn-env-secrets
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$
  - field: new_text
    operator: regex_match
    pattern: (?:SECRET|PASSWORD|KEY|TOKEN)\s*=\s*\S+
action: warn
---

**Writing secrets to .env file**

Make sure this `.env` file is in `.gitignore` and NEVER committed to version control. Verify the value is not a real production secret.
