# Architecture Rules

## File layout

The entire site lives in one `index.html`. Do not split into multiple files unless the file exceeds ~1500 lines and a build step is introduced.

Order inside `index.html`:
1. `<head>` — meta, fonts, all CSS in one `<style>` block
2. `<body>` — HTML sections in page order (hero → how → features → security → cta → footer)
3. `<script>` — all JS at the bottom, no inline handlers

## Section IDs

| ID | Purpose |
|----|---------|
| `#hero` | Full-viewport opener with phone animation |
| `#how` | How-it-works with step cards + mini animation |
| `#features` | Feature card grid |
| `#security` | Security model (BLE / BUMP / MOTION layers) |
| `#cta` | Call-to-action before footer |
| `footer` | Links + copyright |

## JS conventions

- All animation state is module-scoped variables — no global `window.*` pollution
- Animation loops use `async/await` + `Promise`-wrapped `setTimeout` (`wait(ms)`)
- `requestAnimationFrame` only for smooth frame-by-frame interpolation (approach, spring)
- No external JS libraries — keep zero-dependency

## Pixel phone system

The 7×14 pixel grid is defined once as `GRID` constant. `buildPhone(el, pxSize)` creates DOM cells and returns a `cells` array. `setScreen(cells, lit)` toggles the screen pixels yellow. Do not inline pixel colors — always use `setScreen()`.

## Adding new sections

1. Add HTML between existing `<hr class="divider" />` separators
2. Add CSS in the `<style>` block near the bottom of the existing rules for that element type
3. Do not introduce new class naming conventions — follow the existing `section-label`, `section-title`, `section-body` pattern
