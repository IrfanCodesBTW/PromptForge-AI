# Layout

## Structure (unchanged from PromptForge AI's current IA)
```
┌─────────────────────────────────────────────┐
│ Titlebar (36px)                              │
├───────────────┬───────────────────────────────┤
│ Sidebar        │ Main content (routed)         │
│ (220px)        │                               │
│                │                               │
└───────────────┴───────────────────────────────┘
```
No structural/IA change — same three-region layout as today's `App.tsx` (`Titlebar` + `Sidebar` + routed `<main>`). Only the visual treatment of each region changes.

## Grid & spacing
- Base spacing unit: 4px (unchanged from the current Tailwind config's implicit scale — `space` tokens in `tokens.json` are multiples of 4).
- Card internal padding: `space.6` (24px) as a default; dense list rows (history entries, hotkey rows) may use `space.4` (16px).
- Gap between sibling cards in a settings section: `space.4`–`space.5` (16–20px).
- Content max-width: `layout.contentMaxWidth` (1120px), centered, matching the existing `max-w-4xl mx-auto` pattern in `Settings.tsx` (bump slightly to accommodate the larger card padding).

## Sidebar
- Width: 220px (was 200px — the extra 20px accommodates the larger text/icon spacing of the new type scale).
- Background: `color.canvas.sidebar` (same as page canvas — no separate panel color, unlike the current `bg-surface` which is visually distinct from `bg-bg`). This is a deliberate Wispr Flow trait: the sidebar and canvas are the same color, separated only by content and a hairline border.
- Divider: 1px `surface.border` on the right edge only (matches current `border-r border-border`).

## Responsiveness
PromptForge AI is a fixed-chrome Electron desktop window, not a responsive web page — there is no mobile breakpoint to design for. The only responsive concern is **window resize**:
- Sidebar stays fixed-width (220px) down to a minimum window width; below that, follow the existing app's minimum-window-size constraint (check `electron-builder.yml`/main process window options — do not change it as part of this redesign).
- Main content area uses `flex-1 overflow-y-auto` (unchanged) so it scrolls independently of the sidebar.
- Settings sub-nav (General/Providers/Hotkeys/Appearance/Privacy) stays a fixed-width left column (`w-40`→ increase slightly to `w-44` to fit the new type scale's label widths) at all supported window widths; it does not collapse to icons-only, since this is a desktop app with a comfortable minimum width, not a phone screen.

## Density reference (from the source prompt's page inventory)
The originating brief noted rough per-page density (links/buttons/cards/nav/inputs) for a marketing site. PromptForge AI is an application, not a marketing site, so those exact figures don't transfer — but the underlying instruction (design for the actual density you have) still applies: Settings has ~5 nav sections × 2–6 controls each, History has an unbounded scrolling list of cards, Templates has an empty-state-first list. Card and row components in `components.md` are built to handle all three densities without bespoke exceptions.
