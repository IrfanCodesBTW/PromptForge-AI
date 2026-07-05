# Typography

## Font families
| Token | Stack | Use |
|---|---|---|
| `font.family.display` | `'GT Sectra', 'Tiempos Headline', Georgia, 'Times New Roman', serif` | Page titles ("Settings," "Insights," "Welcome back, Irfan"), large stat numbers (120, 1,151, 13,581) |
| `font.family.body` | `'Inter', 'Söhne', -apple-system, 'Segoe UI', sans-serif` | Everything else: nav labels, form labels, body copy, buttons, table/list content |
| `font.family.mono` | `'JetBrains Mono', 'SF Mono', Consolas, monospace` | Hotkey chips (e.g. `Ctrl+Shift+K`), code/prompt text — unchanged from PromptForge's current mono stack |

**Note on the display font**: the exact Wispr Flow serif is not identifiable from screenshots with certainty. `GT Sectra` and `Tiempos Headline` are both licensed; if neither is available, use any humanist serif with moderate contrast and warm proportions (avoid high-contrast "fashion" serifs like Didot — they read cold, which is the opposite of the intended effect). Do not substitute a generic system serif like Times New Roman in production; it is listed only as a fallback.

## Scale
| Token | Size | Line height | Typical use |
|---|---|---|---|
| `font.size.xs` | 12px | 1.3 | Timestamps, helper text, hotkey labels |
| `font.size.sm` | 13px | 1.4 | Secondary body text, nav labels |
| `font.size.base` | 14px | 1.5 | Default body text, form inputs |
| `font.size.md` | 16px | 1.5 | Card titles, section labels |
| `font.size.lg` | 20px | 1.3 | Sub-headings |
| `font.size.xl` | 28px | 1.15 | Page titles (serif) |
| `font.size.2xl` | 36px | 1.15 | Hero/welcome headline (serif) |
| `font.size.displaySm` | 28px | 1.1 | Small stat numbers (serif, e.g. "120") |
| `font.size.displayMd` | 40px | 1.1 | Large stat numbers (serif, e.g. "13,581") |

## Weight usage
- Serif display text: `regular` (400) or `medium` (500) only. Wispr's serif headings are not bold — weight comes from size and letter spacing, not boldness. Do not set the serif font to `bold` (700); it breaks the editorial feel and most editorial serifs render poorly at synthetic bold.
- Sans body text: `regular` (400) for paragraphs and descriptions, `medium` (500) for active nav items and card titles, `semibold` (600) reserved for the rare emphasis case (e.g. a total or a warning label).

## Rules: Do
- Pair every serif heading with a sans sub-label directly beneath it in `text.secondary` at `font.size.sm` (see "Settings" → "Configure PromptForge AI to your preferences" pattern).
- Keep line length for body paragraphs under ~75 characters for readability.
- Use tabular/lining numerals for all stat displays so numbers don't jitter when they update.

## Rules: Don't
- Don't use the serif font for interactive elements (buttons, links, nav items, inputs). Serif is for reading, not for doing.
- Don't mix more than two weights within a single component.
- Don't drop below `font.size.xs` (12px) anywhere — Wispr Flow has no true "micro" text size, and going smaller will fail AA contrast/legibility expectations in `accessibility.md`.

## Accessibility acceptance criteria
(Ratios below computed with the WCAG 2.2 relative-luminance formula against this spec's actual token hex values — not estimates.)
- [ ] Body text is never smaller than 12px equivalent at 100% zoom.
- [ ] `color.text.primary` (#211F1B) on `color.canvas.base` (#F7F4EC) passes AA body-text contrast — verified at 14.97:1.
- [ ] `color.text.secondary` (#68625A) on canvas passes AA body-text contrast (4.5:1 target) — verified at 5.49:1.
- [ ] `color.text.tertiary` (#847D70) passes only the AA **large-text** threshold (3:1), verified at 3.42:1 on canvas / 3.75:1 on white cards. It must not be used for body-size (≤14px regular) text — reserve it for large labels (≥18px, or ≥14px bold) and non-text UI accents.
