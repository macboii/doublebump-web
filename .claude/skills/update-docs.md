---
name: update-docs
description: Analyze this session's changes and update relevant .claude documentation
trigger: /update-docs
---

Do NOT ask questions. Analyze the changes automatically and update only what needs updating.

## 0. Cross-repo legal content check (Privacy / Terms / Child Safety)

DoubleBump's legal text is duplicated by hand across **five files in three repos** — there is no shared source of truth, so drift is silent unless checked explicitly:

| Repo | File(s) | Format |
|------|---------|--------|
| `doublebump_web` (this repo) | `privacy.html`, `terms.html`, `child-safety.html` | static HTML |
| `../doublebump-legal` (sibling dir) | `privacy.html` (privacy content + a duplicate, effectively dead `<div id="terms">` block), `terms.html` (the live `/terms` page) | static HTML |
| `../DoubleBump-ios` (sibling dir) | `DoubleBump/Views/LegalDocumentView.swift` | SwiftUI (`legalSection`/`legalBullet`/`legalSubsection`/`thirdPartyRow`) |
| `../DoubleBump-android` (sibling dir) | `app/src/main/java/com/doublebump/android/ui/screens/LegalDocumentScreen.kt` | Compose (`LegalSection`/`LegalBullet`/`LegalSubsection`/`ThirdPartyRow`) |

Run this check on every `/update-docs` invocation, not just when this session touched a legal file — the iOS/Android repos change independently and won't show up in `git diff` here.

**Steps:**

1. Read all five files above (skip a repo if the sibling directory doesn't exist).
2. For each topic below, compare content across all five and flag mismatches:
   - **Feature coverage** — a data-collecting feature (Radar, Chat, bump memories/photos, location, motion, ads, etc.) documented on one platform but absent on another. Cross-check against `../DoubleBump-ios/.claude/rules/*.md` and `../DoubleBump-android/.claude/rules/*.md` status banners to confirm a feature is actually shipped/coded before requiring its disclosure — don't add a section for something not yet built.
   - **Third-party / data-sharing list** — the "Data Sharing & Third Parties" service list should be the same set per platform (e.g. iOS has Apple Sign-In + APNs that Android doesn't; Android has FCM that iOS doesn't; Supabase/Google Sign-In/AdMob/Firebase should appear on both).
   - **Retention windows and rights/choices bullets** — wording can differ slightly per platform's Settings UI, but the actual retention period or right described must not contradict.
   - **Terminology** — e.g. "Bump Memories" (app terminology) vs "Encounter Memories" (older web terminology) naming the same feature.
   - **"Last updated" / `dateModified`** — should be the same date across all five files whenever content actually changed together; don't bump a date with no content change.
3. Patch every file that's missing content the others already have, writing in that file's native format/voice (HTML `<ul><li>`, Swift `legalBullet(...)`, Kotlin `LegalBullet(...)`) — do not paste raw HTML into Swift/Kotlin files or vice versa.
4. Update `sitemap.xml` `<lastmod>` for any `doublebump_web` legal page whose content changed.
5. Do NOT touch unrelated uncommitted changes in `../DoubleBump-ios` or `../DoubleBump-android` (these are separate active codebases) — edit only the legal document file(s), and do not run `git add`/`commit` in those repos; that's the user's call.

## 1. Identify what changed

Run: `git diff HEAD~1 --name-only`
Run: `git status --short`

If no commits yet, diff against the initial state using `git diff`.

## 2. Classify each change

| Change type | Update target |
|-------------|--------------|
| New section or page layout | `CLAUDE.md` + `rules/architecture.md` |
| CSS design system change (colors, tokens, typography) | `rules/styling.md` |
| Animation logic change | `rules/animation.md` |
| New copy / content update | `CLAUDE.md` content section |
| New command or skill created | `CLAUDE.md` Commands list |
| New reusable JS pattern | `rules/architecture.md` |
| Deploy config change | `CLAUDE.md` Deploy section |
| New asset added (logo, image) | `CLAUDE.md` File Structure |
| App Store / contact info change | `CLAUDE.md` App Store section |

## 3. Update rules

Edit only the files that need updating:

- Do NOT rewrite an entire file — patch only the changed section
- Do NOT duplicate content that already exists
- Do NOT document patterns already obvious from reading the code
- Only create a new rules file if there are 5+ distinct rules for that topic
- Keep rule files concise — bullet points over paragraphs

## 4. Sync CLAUDE.md

Update `CLAUDE.md` only if:
- A new command or skill was added
- A new rule file was created
- The deploy method changed
- The App Store link, contact, or legal URL changed
- A new asset was added to the file structure

Do NOT add session-specific notes or change history to CLAUDE.md.

## 5. Output a summary

After finishing, print:

```
## Docs updated

- <file>: <one-line reason>

## Skipped (no changes needed)

- <file>: <why>
```

If nothing needed updating, say so clearly rather than making unnecessary edits.
