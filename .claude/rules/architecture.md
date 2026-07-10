# Architecture Rules

## File layout

The entire site lives in one `index.html`. Do not split into multiple files unless the file exceeds ~1500 lines and a build step is introduced. Binary assets go under `assets/` — `assets/features/*.webp` (landscape concept banners, `cwebp -q 82`) and `assets/screens/*.webp` (portrait app screenshots, `cwebp -q 80 -resize 640 0`).

Order inside `index.html`:
1. `<head>` — meta, fonts, all CSS in one `<style>` block
2. `<body>` — HTML sections in page order (hero → how → showcase → features → screens → security → faq → cta → footer)
3. `<script>` — all JS at the bottom, no inline handlers

## Section IDs

| ID | Purpose |
|----|---------|
| `#hero` | Full-viewport opener with phone animation |
| `#how` | How-it-works with step cards + mini animation |
| `#showcase` | Visual feature banners (landscape WebP, responsive grid) |
| `#features` | Feature card grid |
| `#screens` | Portrait app screenshots in phone frames, each with a title + description caption |
| `#security` | Security model (BLE / BUMP / MOTION layers) |
| `#cta` | Call-to-action before footer |
| `footer` | Links + copyright |

## JS conventions

- All animation state is module-scoped variables — no global `window.*` pollution
- Animation loops use `async/await` + `Promise`-wrapped `setTimeout` (`wait(ms)`)
- `requestAnimationFrame` only for smooth frame-by-frame interpolation (approach, spring)
- No external JS libraries — keep zero-dependency

## SEO / structured data

The `<head>` carries the full SEO surface — keep these in sync when content changes:
- Meta: description, keywords, canonical, Open Graph + Twitter cards (`og:image`/`twitter:image` point to the dedicated 1200×630 `assets/og-image.png`; regenerate it from `assets/og-image.source.html` via headless Chrome `--screenshot`), `og:locale` en_US + `ko_KR` alternate, `theme-color`.
- One JSON-LD `@graph` with: `WebSite`, `WebPage` (+ `speakable`, `dateModified`), `SoftwareApplication` (+ `screenshot` array of the real `assets/screens/*.webp`, `downloadUrl` for both stores), `HowTo`, `FAQPage`. The `FAQPage` answers mirror the visible `#faq` copy — update both together.
- `sitemap.xml` + `robots.txt` live at root; `robots.txt` explicitly allows AI/answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, …) for AEO/GEO. Add any new page to `sitemap.xml`.
- Dates in structured data are absolute (`2026-07-10`); bump `dateModified`/`lastmod` on meaningful content changes.

## Internationalization (i18n)

English is the default; Korean is a runtime toggle (no page reload, no separate files).

- Mark any translatable text node with `data-i18n="<key>"`. Keep English as the inline HTML — it's the source of truth and the EN fallback.
- Korean strings live in the `I18N.ko` dictionary in the first bottom `<script>`. Every `data-i18n` key must have exactly one `ko` entry (no missing, no unused).
- On load, each node's English HTML is snapshotted into `dataset.en`; `setLang('en')` restores it, `setLang('ko')` swaps in the dict value. Values may contain HTML (`<strong>`, `<br>`) — applied via `innerHTML`.
- Choice persists in `localStorage['db_lang']` and updates `<html lang>`.
- Pixel-font decorative text (DOUBLE BUMP logo, `.section-label` tags, `.layer-badge`, step nums, `Ready to bump?`) stays English in both languages — `Press Start 2P` has no Korean glyphs. Do not add `data-i18n` to `.pixel` elements.

## Pixel phone system

The 7×14 pixel grid is defined once as `GRID` constant. `buildPhone(el, pxSize)` creates DOM cells and returns a `cells` array. `setScreen(cells, lit)` toggles the screen pixels yellow. Do not inline pixel colors — always use `setScreen()`.

## Adding new sections

1. Add HTML between existing `<hr class="divider" />` separators
2. Add CSS in the `<style>` block near the bottom of the existing rules for that element type
3. Do not introduce new class naming conventions — follow the existing `section-label`, `section-title`, `section-body` pattern
