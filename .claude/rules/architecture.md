# Architecture Rules

## File layout

The entire site lives in one `index.html`. Do not split into multiple files unless the file exceeds ~1500 lines and a build step is introduced. Binary assets go under `assets/`:

- `assets/features/*.webp` — portrait App Store shots for `#showcase`, `cwebp -q 82 -resize 640 0`. Each banner ships as a pair: `showcase-N.webp` (English artwork) + `showcase-N-ko.webp` (Korean artwork).
- `assets/screens/*.webp` — portrait app screenshots, `cwebp -q 80 -resize 640 0`.
- `assets/demo/` — `bump-demo.mp4` (real bump footage, silent, ~4 s loop) + `bump-demo-poster.webp`.

Source media lives outside the repo; re-encode rather than committing the originals. The demo clip is trimmed and carries a `boxblur` mask over the profile card, because the raw recording shows real email addresses. **Any new footage must be checked for personal data before it is committed.**

Order inside `index.html`:
1. `<head>` — meta, fonts, all CSS in one `<style>` block
2. `<body>` — HTML sections in page order (hero → why → concept → how → showcase → features → screens → value → security → faq → vision → cta → footer)
3. `<script>` — all JS at the bottom, no inline handlers

## Section IDs

The page tells one story in order: **why → what → how → proof → value → vision.**

| ID | Purpose |
|----|---------|
| `#hero` | Full-viewport opener with phone animation |
| `#why` | The problem — online connection vs. remembering a real meeting, plus three `from → to` shift rows |
| `#concept` | The idea in four stages: `BUMP → CONNECT → REMEMBER → BUILD` (2×2 card grid) |
| `#how` | How-it-works with step cards + mini animation + the real demo video |
| `#showcase` | App Store banners (portrait WebP, 4-up desktop / 2-up mobile, language-swapped) |
| `#features` | Feature card grid |
| `#screens` | Portrait app screenshots in phone frames, each with a title + description caption |
| `#value` | What the experience gives the user — three long-form value cards |
| `#security` | Security model (BLE / BUMP / MOTION layers) |
| `#vision` | Closing statement + pull quote ("records and celebrates", not "rates") |
| `#cta` | Call-to-action before footer |
| `footer` | Links + copyright |

`#why`, `#concept`, `#value` and `#vision` carry the product-introduction narrative — keep their copy aligned with each other when any one of them changes.

## JS conventions

- All animation state is module-scoped variables — no global `window.*` pollution
- Animation loops use `async/await` + `Promise`-wrapped `setTimeout` (`wait(ms)`)
- `requestAnimationFrame` only for smooth frame-by-frame interpolation (approach, spring)
- No external JS libraries — keep zero-dependency

## SEO / structured data

The `<head>` carries the full SEO surface — keep these in sync when content changes:
- Meta: description, keywords, canonical, Open Graph + Twitter cards (`og:image`/`twitter:image` point to the dedicated 1200×630 `assets/og-image.png`; regenerate it from `assets/og-image.source.html` via headless Chrome `--screenshot`), `og:locale` en_US + `ko_KR` alternate, `theme-color`.
- One JSON-LD `@graph` with: `WebSite`, `WebPage` (+ `speakable`, `dateModified`), `SoftwareApplication` (+ `screenshot` array of the real `assets/screens/*.webp`, `downloadUrl` for both stores), `VideoObject` (the `#how` demo clip — keep `duration`/`uploadDate` truthful if the clip is re-cut), `HowTo`, `FAQPage`. The `FAQPage` answers mirror the visible `#faq` copy — update both together.
- `sitemap.xml` + `robots.txt` live at root; `robots.txt` explicitly allows AI/answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, …) for AEO/GEO. Add any new page to `sitemap.xml`.
- Dates in structured data are absolute (`2026-07-10`); bump `dateModified`/`lastmod` on meaningful content changes.

## Internationalization (i18n)

English is the fallback; Korean is a runtime toggle (no page reload, no separate files). Only `index.html` is translated — the legal pages are English-only.

- Mark any translatable text node with `data-i18n="<key>"`. Keep English as the inline HTML — it's the source of truth and the EN fallback.
- Korean strings live in the `I18N.ko` dictionary in the first bottom `<script>`. Every `data-i18n` key must have exactly one `ko` entry (no missing, no unused).
- On load, each node's English HTML is snapshotted into `dataset.en`; `setLang('en')` restores it, `setLang('ko')` swaps in the dict value. Values may contain HTML (`<strong>`, `<br>`) — applied via `innerHTML`.
- Startup language priority: saved `localStorage[LANG_KEY]` (only ever `'en'`/`'ko'`) → `detectLang()` → `'en'`. `detectLang()` walks `navigator.languages` (falling back to `navigator.language`) and returns `'ko'` for any Korean tag (`ko`, `ko-KR`, `ko-Kore-KR`).
- `setLang(lang, persist)` — only pass `persist: true` from the toggle click. Auto-detected languages must **not** be written to `localStorage`, otherwise a stale first-visit value would outrank the visitor's later browser locale forever.
- The storage key is versioned (`LANG_KEY = 'db_lang_choice'`) and the legacy `'db_lang'` key is deleted on load. Pre-2026-08 builds wrote `'db_lang'` on *every* page load, so every earlier visitor carries an `'en'` that was never a real choice — reading it would pin them to English forever. **If the persistence rules ever change again, bump the key rather than reusing it.**
- `setLang` also updates `<html lang>` and the toggle button label.
- **Localized artwork**: an `<img data-i18n-src="…-ko.webp" data-i18n-alt="…">` gets its `src` and `alt` swapped by `setLang`. The inline `src`/`alt` stay English and are snapshotted into `dataset.enSrc` / `dataset.enAlt` on load. Used by `#showcase`; the English and Korean files must be the same pixel dimensions or the grid reflows on toggle.
- Text is swapped from a bottom-of-`<body>` script, so Korean visitors see a brief flash of English. Accepted trade-off — fixing it means moving translation into `<head>` or shipping separate `ko/` pages.
- Pixel-font decorative text (DOUBLE BUMP logo, `.section-label` tags, `.layer-badge`, step nums, `Ready to bump?`) stays English in both languages — `Press Start 2P` has no Korean glyphs. Do not add `data-i18n` to `.pixel` elements.
- A node that must translate but sits on a `.pixel` element (e.g. `.how-note`) keeps `data-i18n` and drops the pixel font only for Korean via `html[lang="ko"] .selector { font-family: ... }` — don't exclude it from translation just because it's styled `.pixel`.

## Pixel phone system

The 7×14 pixel grid is defined once as `GRID` constant. `buildPhone(el, pxSize)` creates DOM cells and returns a `cells` array. `setScreen(cells, lit)` toggles the screen pixels yellow. Do not inline pixel colors — always use `setScreen()`.

## Adding new sections

1. Add HTML between existing `<hr class="divider" />` separators
2. Add CSS in the `<style>` block near the bottom of the existing rules for that element type
3. Do not introduce new class naming conventions — follow the existing `section-label`, `section-title`, `section-body` pattern
