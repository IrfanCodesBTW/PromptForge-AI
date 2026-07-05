# Desktop Guidelines
### Native-feeling window chrome for an Electron app

PromptForge AI is a frameless Electron window with custom titlebar controls (`Titlebar.tsx`), not a browser tab. These rules keep the redesign feeling like a real desktop app rather than a themed webpage.

## Titlebar
- Height stays 36px (`layout.titlebarHeight`) — don't shrink it below the current 9 (36px) Tailwind spacing value; that's close to the platform-native minimum for comfortable dragging.
- Background: same as canvas (`color.canvas.base`), not a separate darker/lighter bar — matches Wispr Flow's flush, chrome-light aesthetic where the sidebar/titlebar don't compete visually with content.
- Bottom border: 1px `surface.border`, replacing the current `border-b border-border` (same technique, new color).
- App name stays sans, `font.size.sm`, `font.weight.semibold`, `text.primary`. Version tag stays `font.size.xs`, `text.tertiary` — but per `accessibility.md`, tertiary text this small must not be used for anything meaningful (it isn't; it's decorative version metadata, acceptable as a documented exception, not a body-text use).
- **Do not change** the `titlebar-drag` / `titlebar-no-drag` CSS classes or their application to elements — this is what makes window dragging work at the OS level and has nothing to do with visual styling.

## Window controls (minimize / maximize / close)
- Keep icon-based (Lucide `Minus`/`Square`/`X`), same sizes (14px/12px/14px).
- Hover backgrounds move from the current dark `hover:bg-surface-elevated` to `surface.cardHover`; close button keeps its red-on-hover treatment (`state.error` background, white icon) — this is a near-universal convention users expect and Wispr Flow's own screenshots don't override it, so don't remove it.
- **Do not change** the `onClick` handlers (`window.api?.invoke('promptforge:window:toggle', …)` / `window.api?.invoke('promptforge:app:quit')`) — visual layer only.

## Native platform conventions to preserve
- Keep controls on the right edge (current Windows/Linux-style convention) unless the user explicitly wants macOS-style traffic lights on the left — that's a product decision outside this design system's scope, not a Wispr Flow visual detail.
- Respect the OS's own light/dark preference for chrome that Electron itself renders (scrollbar theme, native context menus) — this redesign only touches the in-app rendered UI.

## Elevation in a desktop context
Because this is a single always-on-top-ish app window (not a browser page with competing tabs/chrome), use elevation (`shadow.card`/`shadow.raised`) sparingly — mainly to distinguish cards from the canvas, not to simulate multiple stacked "windows" within the window. Reserve `shadow.modal` exclusively for an actual modal overlay, if one is ever introduced.
