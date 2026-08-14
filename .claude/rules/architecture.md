# Architecture Rules

## File layout

The entire site lives in one `index.html`. Do not split into multiple files unless the file exceeds ~1500 lines and a build step is introduced. Binary assets go under `assets/`:

- `assets/features/*.webp` — portrait App Store shots for `#showcase`, `cwebp -q 82 -resize 640 0`. Each banner ships as a pair: `showcase-N.webp` (English artwork) + `showcase-N-ko.webp` (Korean artwork).
- `assets/screens/*.webp` — portrait app screenshots for `#screens`, `cwebp -q 80 -resize 640 0`. Each screen ships as a pair: `screen-name.webp` (English) + `screen-name-ko.webp` (Korean).
- `assets/demo/` — `bump-demo.mp4` (real bump footage, silent, ~4 s loop) + `bump-demo-poster.webp`.
- `assets/qr/*.webp` — App Store / Google Play QR codes for `#cta`, 640×640, `cwebp -lossless` (never lossy — compression artifacts on hard module edges risk scan failures). Each store ships an EN + `-ko` pair (`appstore-qr.webp`/`appstore-qr-ko.webp`, `googleplay-qr.webp`/`googleplay-qr-ko.webp`) encoding the same URLs as that store's `data-i18n-href` link, so the QR and the button next to it always point to the same storefront. Generated with `qrcode`/Pillow (H error-correction, `logo.png` centered at 20% width on a white rounded backdrop — mirrors `DoubleBump-ios`'s `InviteView.overlayLogo`/`DoubleBump-android`'s `InviteScreen.kt` `drawCenterLogo`) — not hand-drawn; regenerate with the same recipe if a store URL changes, and verify the output still decodes (e.g. with `cv2.QRCodeDetector`) before committing.

Source media lives outside the repo; re-encode rather than committing the originals. The demo clip is trimmed and carries a `boxblur` mask over the profile card, because the raw recording shows real email addresses. **Any new footage must be checked for personal data before it is committed.**

Order inside `index.html`:
1. `<head>` — meta, fonts, all CSS in one `<style>` block
2. `<body>` — HTML sections in page order (hero → tryit → why → concept → how → showcase → features → screens → value → security → faq → vision → cta → footer)
3. `<script>` — all JS at the bottom, no inline handlers

## Section IDs

The page tells one story in order: **proof → why → what → how → value → vision.** The real demo video and a friend-focused CTA sit directly after the hero (`#tryit`), before the philosophical WHY — a first-time visitor sees proof and gets a concrete "do this now" action before the narrative content. `#how` still explains the 3-step flow but no longer carries the video, so don't re-add it there.

| ID | Purpose |
|----|---------|
| `#hero` | Full-viewport opener with phone animation |
| `#tryit` | Real demo video + "both install → open → bump twice" steps + store buttons. The earliest conversion point on the page — see it, then act. |
| `#why` | The problem — online connection vs. remembering a real meeting, plus three `from → to` shift rows |
| `#concept` | The idea in four stages: `BUMP → CONNECT → REMEMBER → BUILD` (2×2 card grid), plus a closing callout contrasting DoubleBump's repeat-bump model against apps that stop at a contact swap |
| `#how` | How-it-works with step cards + mini animation (text/steps only — the real demo video lives in `#tryit`, not here) |
| `#showcase` | App Store banners (portrait WebP, 4-up desktop / 2-up mobile, language-swapped) |
| `#features` | Feature card grid |
| `#screens` | Portrait app screenshots in phone frames, each with a title + description caption |
| `#value` | What the experience gives the user — three long-form value cards |
| `#security` | Security model (BLE / BUMP / MOTION layers). Copy avoids absolute claims ("impossible", "no spoofing") and raw specs (dBm, cm, ms) in visible text — keep it to what a non-technical reader needs; exact numbers still live in the JSON-LD description for search engines. |
| `#vision` | Closing statement + pull quote — meeting a friend and recording the moment is how the friendship grows |
| `#cta` | Call-to-action before footer — store buttons plus a `.qr-row` of two App Store / Google Play QR codes, for desktop visitors who want to grab the app on their phone |
| `footer` | Links + copyright |

`#why`, `#concept`, `#value` and `#vision` carry the product-introduction narrative — keep their copy aligned with each other when any one of them changes. `#tryit` is the conversion-focused counterpart to that narrative — keep it short; it's meant to be skimmed in seconds, not read like the sections below it.

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
- **Localized artwork**: an `<img data-i18n-src="…-ko.webp" data-i18n-alt="…">` gets its `src` and `alt` swapped by `setLang`. The inline `src`/`alt` stay English and are snapshotted into `dataset.enSrc` / `dataset.enAlt` on load. Used by `#showcase`, `#screens`, and the `#cta` QR row; the English and Korean files must be the same pixel dimensions or the layout reflows on toggle.
- **Localized store links**: an `<a data-i18n-href="…">` gets its `href` swapped the same way (`dataset.enHref` snapshot, same `setLang` block). Used on all three App Store / Google Play button pairs (hero, `#tryit`, `#cta`) — the bare URL lets Apple/Google geo-detect for English visitors, the Korean href pins `/kr/` (Apple) or `&hl=ko&gl=KR` (Google) so the toggle's language actually reaches the store page, which neither store infers from the referring site on its own.
- Text is swapped from a bottom-of-`<body>` script, so Korean visitors see a brief flash of English. Accepted trade-off — fixing it means moving translation into `<head>` or shipping separate `ko/` pages.
- Pixel-font decorative text (DOUBLE BUMP logo, `.section-label` tags, `.layer-badge`, step nums, `Ready to bump?`) stays English in both languages — `Press Start 2P` has no Korean glyphs. Do not add `data-i18n` to `.pixel` elements.
- A node that must translate but sits on a `.pixel` element (e.g. `.how-note`) keeps `data-i18n` and drops the pixel font only for Korean via `html[lang="ko"] .selector { font-family: ... }` — don't exclude it from translation just because it's styled `.pixel`.

## Pixel phone system

The 7×14 pixel grid is defined once as `GRID` constant. `buildPhone(el, pxSize)` creates DOM cells and returns a `cells` array. `setScreen(cells, lit)` toggles the screen pixels yellow. Do not inline pixel colors — always use `setScreen()`.

## Adding new sections

1. Add HTML between existing `<hr class="divider" />` separators
2. Add CSS in the `<style>` block near the bottom of the existing rules for that element type
3. Do not introduce new class naming conventions — follow the existing `section-label`, `section-title`, `section-body` pattern
