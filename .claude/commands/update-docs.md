---
name: update-docs
description: Analyze this session's changes and update relevant .claude documentation
---

Do NOT ask questions. Analyze the changes automatically and update only what needs updating.

## 1. Identify what changed

Run: `git diff HEAD~1` or review the session's changed file list.

If no commits yet, diff against the initial state using `git status` and `git diff`.

## 2. Classify each change

| Change type | Update target |
|-------------|--------------|
| New section or page layout added | `CLAUDE.md` + `rules/architecture.md` |
| CSS design system change (colors, tokens, typography) | `rules/styling.md` |
| Animation logic change | `rules/animation.md` |
| New copy / content update | `CLAUDE.md` content section |
| New command created | `CLAUDE.md` commands list |
| New reusable JS pattern discovered | `rules/architecture.md` |
| Deploy config change | `CLAUDE.md` deploy section |

## 3. Update rules

Edit only the files that need updating. Rules for editing:

- Do NOT rewrite an entire file — patch only the changed section
- Do NOT duplicate content that already exists
- Do NOT document patterns that are already obvious from reading the code
- Only create a new rules file if there are 5+ distinct rules for that topic
- Keep rule files concise — bullet points over paragraphs

## 4. Sync CLAUDE.md

Update `CLAUDE.md` only if:
- A new command was added (update the Commands list)
- A new rule file was created (add a link under Key Rules)
- The deploy method changed
- The App Store link or contact info changed

Do NOT add session-specific notes or change history to CLAUDE.md.

## 5. Output a summary

After finishing, print:

```
## Docs updated

- <file>: <one-line reason>
- <file>: <one-line reason>

## Skipped (no changes needed)

- <file>: <why>
```

If nothing needed updating, say so clearly rather than making unnecessary edits.
