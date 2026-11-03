# Contributing

Thanks for helping! This repo is documentation plus a small starter template.

- **Skill text** (`skills/create-connector/SKILL.md`, `references/`): keep it short, concrete and tested. Add a pitfall to `references/gotchas.md` only if it cost real time and you know the fix.
- **Template** (`skills/create-connector/templates/`): it must install, typecheck and pass its own test. Check before opening a PR:
  ```bash
  cp -r skills/create-connector/templates /tmp/t && cd /tmp/t
  npm install && npm run typecheck
  PORT=3999 npm run dev &      # then: npm test -- http://localhost:3999/mcp
  ```
- No secrets, no personal data, no project-specific names in templates.
- Open an issue before large changes.
