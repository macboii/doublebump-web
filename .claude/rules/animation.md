# Animation Rules

## Pixel phone grid

The 7×14 GRID matrix defines the phone silhouette. Pixel types:
- `1` in rows 0–2: bright body (`rgba(255,255,255,1.0)`)
- `1` in rows 3–13: dim body (`rgba(255,255,255,0.82)`)
- `0` inside rows 3–10, cols 1–5: screen area (transparent → yellow when lit)
- `0` in corners: truly empty, always transparent

## `buildPhone(el, pxSize)`

Builds DOM cells into `el`. Returns `cells[]` array. Call once per phone element.
`pxSize` controls pixel size in px (hero: 7.5, how-section: 7).

## `setScreen(cells, lit)`

Toggles all screen-type cells yellow (`rgba(255,214,10,0.88)`) or transparent.
This is the only way to change screen color — do not set it via CSS class.

## Animation helpers

| Function | Purpose |
|----------|---------|
| `wait(ms)` | `Promise`-wrapped `setTimeout` |
| `approach(el1, el2, maxGap, minGap, dur, easing)` | Animates flex `gap` toward `minGap` over `dur`ms. Easing: `'in'` (quadratic in) or `'out'` (quadratic out). |
| `spring(el1, el2, fromGap, toGap, dur)` | Overdamped spring: `1 - e^(-6t) * cos(8t)`. Used for recoil after impact. |

Both `approach` and `spring` locate the parent stage via `el.closest('#phone-stage') || el.closest('#anim-stage')` and set `parent.style.gap` directly.

## Hero loop sequence

```
reset gap=28px → approach to 6px → flash + tilt → spring recoil →
wait 140ms → approach to 6px (faster) → flash + tilt → spring recoil →
show "Connected!" label → wait 1600ms → fade label → wait 1200ms → repeat
```

## How-section loop sequence

```
gap=26px, screens off, step 1 active → wait 800ms →
step 2 active, approach → tilt → spring recoil → wait 140ms →
approach again → tilt → spring recoil →
screens on (yellow), step 3 active → wait 1800ms →
screens off → wait 400ms → repeat
```

## Adding animations

- Always `async/await` — never nested `setTimeout` callbacks
- Use `requestAnimationFrame` only inside `approach`/`spring`-style interpolation loops
- Keep phone `transform-origin: bottom center` so rotation pivots at the base
- Mirror (right phone): apply `scaleX(-1)` as part of the transform string, not as a separate CSS class override
