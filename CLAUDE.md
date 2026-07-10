# DoubleBump Web — Landing Page

## Project Overview

Static landing page for the DoubleBump iOS app. Single `index.html` file with embedded CSS and vanilla JS. No build step, no framework, no dependencies except the Google Fonts CDN.

## Stack

- **HTML/CSS/JS** — single `index.html`, zero dependencies
- **Font** — Press Start 2P via Google Fonts (pixel aesthetic)
- **Animations** — vanilla JS `requestAnimationFrame` loops
- **Hosting** — intended for GitHub Pages or Vercel static

## File Structure

```
index.html        # entire site — HTML + CSS + JS in one file
privacy.html      # Privacy Policy page
terms.html        # Terms of Service page
delete-account.html  # Account deletion instructions page
child-safety.html # Child Safety Standards page (Google Play compliance)
logo.png          # 1024×1024 app icon (also used for favicon + OG image)
assets/
  features/       # feature banner WebP screenshots (#showcase section)
CLAUDE.md         # this file
.claude/
  commands/       # slash commands (legacy — prefer skills/)
  skills/         # slash skills: gitpush, update-docs
  rules/          # detailed rule files
  settings.json   # Stop hook — doc maintenance reminder
  settings.local.json  # permission allowlist
```

## Key Rules

- See [rules/architecture.md](.claude/rules/architecture.md) — structure & code conventions
- See [rules/styling.md](.claude/rules/styling.md) — design system & CSS conventions
- See [rules/animation.md](.claude/rules/animation.md) — pixel phone animation system

## Commands

- `/gitpush` — lint check, commit, and push
- `/update-docs` — analyze session changes and update .claude docs

## App Store

- iOS App: `https://apps.apple.com/app/id6770075271`
- Contact: bangcoderpro@gmail.com
- Legal: `https://macboii.github.io/doublebump-legal/`

## Deploy

No build step. Deploy `index.html` directly.

- **GitHub Pages**: push to `main`, enable Pages from root
- **Vercel**: drag-and-drop or connect repo — auto-detects static
