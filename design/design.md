# Wispr Flow — Design System
### Reference spec for redesigning PromptForge AI

## 1. Design Intent (one sentence)
Replace PromptForge AI's dark, generic-SaaS surface with Wispr Flow's warm, editorial, low-friction visual language — cream canvases, an editorial serif for hierarchy, sage/forest-green as the single accent, pill-shaped controls, and generous breathing room — without changing any existing functionality, IPC calls, or routing.

## 2. Where these tokens came from
Every color, spacing, radius, and layout value in `tokens.json` was measured or closely estimated from three Wispr Flow screenshots: the **Home** dashboard, the **Insights** page, and the **Settings → General** modal. Where a screenshot cannot tell us something (animation timing, the exact licensed typeface), the token is labeled `inferred` in `tokens.json` / `motion.md` and a reasonable substitute is given instead of a guess presented as fact. Treat those specific values as a starting point to tune once the redesign is running, not as verified specification.

## 3. What Wispr Flow is doing visually, and why it works
- **Warm neutral canvas, not black or pure white.** The base background (`color.canvas.base` = `#F7F4EC`) is a soft cream, not white and nowhere near PromptForge's current near-black (`#0F1419`). Cream reads as calm and editorial rather than "developer tool," and it makes the single green accent color pop without needing high-saturation UI chrome.
- **One accent color, used sparingly.** Forest green (`#2F4F42`) appears only on the progress ring, the streak heatmap's darkest cells, and implicitly on focus states. There is no second "primary blue" competing for attention — unlike PromptForge's current `--color-primary: #3B82F6`, which is used everywhere (nav highlight, buttons, links, focus ring).
- **Serif for numbers and headings, sans for everything functional.** "Welcome back, Irfan," "General," and the big stat numbers (120, 1,151, 13,581) are set in an editorial serif. Body copy, nav labels, form labels, and buttons stay in a clean grotesque sans. This split is what gives the product a premium, human feel instead of a dashboard-template feel — it is the single highest-leverage change to make.
- **Pill-shaped everything.** Buttons ("Change," "Show me how"), badges ("Pro"), and toggle rows all use fully rounded corners (`radius.pill` = 999px). Cards use a large but not fully round radius (`radius.lg`–`radius.xl`, 20–24px). PromptForge currently uses small radii (4–12px) everywhere, which is a large part of why it reads as generic.
- **Low-contrast borders, not boxed cards.** Card edges are a 1px hairline in a color barely darker than the canvas (`#E8E3D6` on `#F7F4EC`), plus a very soft ambient shadow. Nothing has a hard, high-contrast outline.
- **Generous whitespace and large touch targets.** Padding inside cards is consistently ~24px; sidebar items and pill buttons are tall (36–40px) with wide horizontal padding. PromptForge's current spacing scale (4/8/12/16/24/32/48px) is compatible — the redesign should raise default component padding to the larger end of that scale, not invent a new one.
- **Quiet status signaling.** The one notification affordance visible (the small red dot on "Shortcuts" and "Settings") is a plain 8px dot, no ring, no animation implied. Status is communicated with color and position, not motion or size.

## 4. Non-negotiables (must)
- Canvas **must** be a warm off-white, never pure white (`#FFFFFF`) and never dark. This is the single biggest visual signal of the redesign — if the background stays dark, nothing else about this spec will read as "Wispr Flow inspired."
- Text on canvas **must** meet WCAG 2.2 AA contrast (4.5:1 body, 3:1 large text) — see `accessibility.md`. `color.text.primary` (`#211F1B`) on `color.canvas.base` (`#F7F4EC`) passes at ~14.8:1.
- Only one saturated accent hue (forest green) **must** be used for interactive/affirmative signaling. Lavender is reserved for the "Pro" plan badge only. Red is reserved for destructive/notification only.
- All existing dark-mode/light-mode toggle logic, IPC channels, and component props **must** remain functionally unchanged — this is a token and markup redesign, not a rewrite.

## 5. Recommendations (should)
- Headings and large numeric stats **should** use the serif display font; everything else **should** stay sans.
- Cards **should** use `radius.lg` (20px) at minimum; nothing in the interface **should** ship with a radius smaller than `radius.xs` (8px) going forward.
- Buttons that aren't full-width primary actions **should** default to the pill shape (`radius.pill`), matching Wispr's "Change" / "Save" / "Test Connection" pattern.

## 6. File map
| File | Purpose |
|---|---|
| `design.md` | This file — philosophy and rationale |
| `tokens.json` | Machine-readable token source of truth |
| `typography.md` | Type scale, font stacks, usage rules |
| `components.md` | Anatomy + states for every reusable component |
| `motion.md` | Animation durations, easing, and where motion is/isn't used |
| `icons.md` | Iconography rules (works with existing lucide-react) |
| `layout.md` | Grid, spacing scale, responsiveness, window chrome sizing |
| `accessibility.md` | WCAG 2.2 AA rules with testable pass/fail criteria |
| `desktop-guidelines.md` | Native desktop-window conventions (titlebar, drag regions, traffic-light buttons) |
| `implementation.md` | React + Tailwind conventions mapped to PromptForge AI's actual files |
| `ux-principles.md` | Interaction philosophy (calm, confident, low-friction) |
| `design-review-checklist.md` | Pre-ship QA gate |
| `master-prompt.md` | The end-to-end prompt to hand to Cursor/Claude Code to execute the migration |

## 7. Explicitly out of scope
- No new features, routes, or IPC channels.
- No change to the Groq/Ollama provider logic, hotkey recording logic, or history/template data models.
- No change to window control behavior (minimize/maximize/close still call the same `window.api.invoke` methods) — only their visual styling changes.
