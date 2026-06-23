---
name: gitpush
description: Validate, commit, and push changes for the DoubleBump landing page
---

Do NOT ask any questions or request confirmation at any step. Execute all steps automatically without pausing.

## 1. Pre-commit inspection

Run: `git status`
Run: `git diff`

Review what has actually changed before generating the commit message.

## 2. Safety check — never commit these

- `.env` files of any kind
- Files containing API keys, tokens, or secrets
- macOS junk: `.DS_Store`, `__MACOSX/`
- Editor state: `.vscode/`, `.idea/`

If any of these are staged, unstage them and warn the user before continuing.

## 3. Generate a commit message

Use format: `<type>: <short description>`

Types for this project:

| Type | When to use |
|------|-------------|
| `feat:` | new section, new UI element, or new interactive feature |
| `fix:` | broken layout, wrong link, JS error, visual regression |
| `style:` | CSS-only changes — colors, spacing, typography |
| `content:` | copy edits, text updates, new feature card |
| `anim:` | pixel phone animation logic changes |
| `chore:` | meta tags, favicon, file rename, non-functional config |
| `a11y:` | accessibility improvements (aria, contrast, keyboard nav) |
| `perf:` | loading, paint, or runtime performance improvements |

Examples:
- `feat: add social proof section with bump count stats`
- `fix: correct App Store link URL`
- `style: increase hero title font size on mobile`
- `content: update security model description`
- `anim: smooth out spring recoil timing in hero loop`
- `chore: add Open Graph meta tags`

## 4. Stage and commit

Run: `git add index.html privacy.html terms.html logo.png CLAUDE.md .claude/`

Do NOT use `git add .` — always stage specific known files to avoid accidentally committing junk.

Run: `git commit -m "<generated message>"`

Include co-author trailer:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## 5. Push

Run: `git push`

If push is rejected (no upstream), run:
`git push --set-upstream origin main`

Report the final git status and the remote URL after pushing.
