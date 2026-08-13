# Styling Rules

## CSS custom properties (tokens)

All colors are defined in `:root`. Never hardcode hex values inline — always use a token.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#111111` | page background |
| `--card` | `#1a1a1a` | card/panel background |
| `--card2` | `#222222` | secondary card |
| `--yellow` | `#FFD60A` | brand accent, CTAs, highlights |
| `--white` | `#ffffff` | primary text |
| `--gray` | `#9a9a9a` | secondary / body text (≥5.6:1 on all backgrounds) |
| `--dim` | `#848484` | muted text, captions, inactive states (≥4:1 on all backgrounds) |

`--gray` and `--dim` were bumped from `#888888`/`#444444` — the old `--dim` was ~1.6–1.9:1 against every background, well under WCAG AA (4.5:1 for body text, 3:1 for large/bold). Don't darken either token back down without re-checking contrast against `--bg`, `--card`, `--card2`, and the `#1e1e10` highlighted-card tint.

## Typography

- **Pixel font**: `"Press Start 2P", monospace` — applied via `.pixel` class only. Use for: hero title, tagline, section labels, step numbers, badges.
- **Body font**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` — everything else.
- Use `clamp()` for responsive font sizes: `clamp(min, preferred-vw, max)`.

## Spacing & layout

- Sections use `padding: 80px 24px` and `max-width: 860px; margin: 0 auto`.
- Mobile breakpoint: `@media (max-width: 500px)` — only override padding/gaps, not layout.
- Use CSS Grid for card grids (`repeat(auto-fit, minmax(220px, 1fr))`).
- Use Flexbox for linear / directional layouts.

## Cards & borders

- Cards: `background: var(--card); border: 1px solid #2a2a2a; border-radius: 18px;`
- Active/highlighted card: `border-color: #3a3a1a; background: #1e1e10;` (warm yellow tint)
- Security inner panel: `border-radius: 20px`

- Showcase banners (`.showcase-shot`): same card frame with `overflow: hidden; line-height: 0`; images are `width: 100%; height: auto`. The shots are portrait, so the grid is an explicit `repeat(4, minmax(0, 1fr))` dropping to `repeat(2, …)` under 500px — `auto-fit` collapses to one full-width column on phones and makes each shot ~760px tall.
- App screenshots (`.screen-frame`): `border-radius: 22px` phone frame, same `overflow: hidden; line-height: 0`; each `.screen-item` stacks the frame over a `.screen-cap-title` + `.screen-cap-desc` caption in a `repeat(auto-fit, minmax(180px, 1fr))` grid.
- Demo video (`.demo-video` in `#how`): same card frame, `max-width: 480px`, with a `.demo-cap` caption in `var(--dim)`.

## Narrative sections

`#why`, `#concept`, `#value`, `#vision` all use the centred column pattern (`display: flex; flex-direction: column; align-items: center; text-align: center`) with left-aligned text inside their cards.

| Component | Layout |
|-----------|--------|
| `.shift` (`#why`) | `1fr auto 1fr` grid — dim `.shift-from`, yellow pixel `.shift-arrow`, white bold `.shift-to`. Under 500px it stacks to one column and the arrow rotates 90°. |
| `.stage` (`#concept`) | Fixed `repeat(2, minmax(0, 1fr))` 2×2 grid, one column on mobile. `.stage-num` is a yellow pixel chip, `.stage-name` yellow pixel text. |
| `.value-item` (`#value`) | Single-column card list, `max-width: 620px` — copy is too long for a card grid. |
| `.vision-quote` | The highlighted-card treatment (`#3a3a1a` border, `#1e1e10` background) used as a pull quote. |

## Buttons

`.btn-primary` is the only content button style. Yellow background, black text, 800 weight.
Do not add secondary button styles unless a clear design need exists.
`.lang-toggle` is the one exception — a fixed top-right EN/한국어 switch in pixel font (utility control, not a content button).

## Dividers

Use `<hr class="divider" />` between major sections. Style: `border-top: 1px solid #252525`.

## Animation transitions

- Hover: `transition: opacity 0.15s, transform 0.1s` — keep it fast and subtle
- Screen glow toggle: instant (no CSS transition) — JS sets `background` directly
- Phone tilt on impact: `transition: transform 60ms ease-out`
