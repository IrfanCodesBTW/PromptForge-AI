# Motion

**Honesty note:** static screenshots cannot show timing or easing. Everything in this file is an *inferred, conventional* choice consistent with Wispr Flow's calm, understated visual language — not a measurement. Tune by feel once running; don't treat these numbers as spec-perfect.

## Principles
- Motion should feel *settled*, not springy or bouncy. Wispr Flow's visual language (soft shadows, hairline borders, muted palette) implies restrained, physical-feeling motion — no overshoot, no elastic easing.
- Motion communicates state change (open/close, success/error, active/inactive), never decoration for its own sake.
- Respect `prefers-reduced-motion` — PromptForge's `index.css` already has this handled globally; keep that block as-is.

## Durations
| Token | Value | Use |
|---|---|---|
| `motion.duration.instant` | 100ms | Color/background changes on hover |
| `motion.duration.fast` | 160ms | Toggle switches, button press scale |
| `motion.duration.base` | 220ms | Toast enter/exit, tab/section switch, card hover elevation |
| `motion.duration.slow` | 320ms | Page-level transitions (route change), if ever added |

## Easing
| Token | Curve | Use |
|---|---|---|
| `motion.easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default for most transitions |
| `motion.easing.out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrances (toast/modal appearing) |
| `motion.easing.in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits (toast/modal dismissing) |

## Component-specific guidance
- **Toast** (`Toast.tsx` already uses Framer Motion): keep `initial`/`animate`/`exit` structure, change `transition.duration` to `0.22` and ease to the `standard` curve above; reduce the current `y: 20` entrance offset to `y: 8` — Wispr's implied motion is subtle, not a large slide.
- **Button press**: `scale: 0.98` over `fast` (160ms), standard easing, on `:active`.
- **Toggle switch**: thumb translateX over `fast` (160ms), standard easing; track color crossfades over the same duration.
- **Sidebar active-state pill**: background-color crossfade over `instant`–`fast` (100–160ms); do not animate width/position (no "sliding pill indicator" — Wispr's own screenshots show a static highlight, not an animated indicator).
- **Section switch (Settings sub-nav)**: cross-fade content over `base` (220ms); do not slide horizontally.

## Anti-patterns (don't)
- Don't use spring/bounce easing anywhere — it contradicts the calm, editorial tone.
- Don't animate more than one property group (transform *or* opacity/color) per interaction unless it's an enter/exit transition.
- Don't add motion that only exists to look "premium" — every transition above ties to a real state change.
