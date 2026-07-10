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

## Animation engine (progress-driven)

A bump is one `progress` value (0 = apart, 1 = touching). Gap, inward tilt, and impact scale are **all derived from that single value every frame** — mirroring the progress-driven `SplashView.swift`. Never animate the gap alone with the tilt snapping separately; that desync is what made the old version jerky.

| Function | Purpose |
|----------|---------|
| `wait(ms)` | `Promise`-wrapped `setTimeout` |
| `easeIn` / `easeOut` | `t*t` (accelerate into contact) / `1-(1-t)²` (ease the pop) |
| `tween(dur, ease, onUpdate)` | Timed rAF tween; calls `onUpdate(easedT)` from 0→1 over `dur`ms |
| `springDown(response, damping, onUpdate, settleMs)` | Underdamped spring matching SwiftUI `.spring(response:dampingFraction:)`; `onUpdate` gets displacement 1→0 with a slight dip below 0 for recoil |
| `makeBumper(stageEl, left, right, maxGap)` | Returns `render(progress, scale)` → sets `stage.gap = maxGap-(maxGap-6)·progress`, `rotate(10·progress deg)`, and `scale`. Right phone transform is `scaleX(-1) rotate(...)` |
| `tap(render, peakScale, flashEl?)` | One bump: `tween(150,easeIn)` lean-in → flash + `tween(70,easeOut)` scale pop → `springDown(0.24, 0.62)` recoil |

Hero uses `maxGap: 28`, how-section `maxGap: 26`. There is **no CSS transition** on `.css-phone` — every transform is written per-frame by rAF, so a CSS transition would fight it.

## Loop sequences

- **Hero**: `render(0,1)` → wait 280ms → `tap(1.08, flash)` → wait 120ms → `tap(1.13, flash)` → show "Connected!" → wait 1600ms → fade → wait 650ms → repeat
- **How**: `render(0,1)`, screens off, step 1 → wait 800ms → step 2 + `tap(1.07)` → wait 120ms → `tap(1.10)` → screens on, step 3 → wait 1800ms → screens off → wait 400ms → repeat

## Adding animations

- Always `async/await` — never nested `setTimeout` callbacks
- Use `requestAnimationFrame` only inside `tween`/`springDown`-style interpolation
- Drive gap + tilt + scale from one progress value via `makeBumper` — don't reintroduce gap-only animation
- Keep phone `transform-origin: bottom center` so rotation pivots at the base
- Mirror (right phone): apply `scaleX(-1)` as part of the transform string, not as a separate CSS class override
