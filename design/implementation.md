# Implementation
### React + Tailwind conventions, mapped to PromptForge AI's actual codebase

This file assumes the repo at `IrfanCodesBTW/PromptForge-AI` (Electron + React 18 + TypeScript + Tailwind + Framer Motion + Zustand + lucide-react, `electron-vite` build). It already uses a **CSS-variable-driven token system** (`src/renderer/src/index.css` defines `--color-*` custom properties, consumed by `tailwind.config.js`'s `theme.extend.colors`). This redesign should extend that exact pattern rather than replace it — it's the right architecture already.

## Step 1 — Replace the token layer
**File:** `src/renderer/src/index.css`

Replace the `:root` and `[data-theme="light"]` blocks with values from `tokens.json`. Since Wispr Flow's screenshots only show one visual mode (a warm light theme), treat this as the new **default/light** mode, and derive a dark variant by darkening the canvas/surfaces while keeping the same forest-green accent and serif/sans split (don't just keep the *old* dark palette — it will clash with the new accent and typography).

```css
:root {
  /* Wispr-Flow-inspired light (new default) */
  --color-bg: #F7F4EC;
  --color-surface: #F7F4EC;         /* sidebar/canvas now match, per layout.md */
  --color-surface-elevated: #FFFFFF; /* cards */
  --color-primary: #2F4F42;          /* forest — replaces old blue */
  --color-primary-hover: #254036;
  --color-success: #4F8A66;
  --color-warning: #C98A2B;
  --color-error: #D9483F;
  --color-text-primary: #211F1B;
  --color-text-secondary: #68625A;
  --color-text-muted: #847D70;
  --color-border: #E8E3D6;

  --font-serif: 'GT Sectra', 'Tiempos Headline', Georgia, serif;
  --font-sans: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

[data-theme="dark"] {
  --color-bg: #1C1B17;
  --color-surface: #1C1B17;
  --color-surface-elevated: #262420;
  --color-primary: #7FB897;          /* lighter forest for dark-mode contrast */
  --color-primary-hover: #96C9AA;
  --color-text-primary: #F3F0E8;
  --color-text-secondary: #B8B2A5;
  --color-text-muted: #8C8676;
  --color-border: #38362F;
}
```
Note the existing `darkMode: ['class', '[data-theme="dark"]']` in `tailwind.config.js` means light is now the default `:root`, and `[data-theme="dark"]` is the override — this is a swap from the current file where dark is the `:root` default. Confirm `useAppStore`'s theme logic (in `stores/`) still sets `data-theme` correctly; the class-toggling code itself does not need to change, only which values live under which selector.

## Step 2 — Extend Tailwind config
**File:** `tailwind.config.js`

- Add `fontFamily.serif` (`var(--font-serif)`), keep `fontFamily.sans`/`fontFamily.mono` pointed at the new CSS variables instead of hardcoded stacks (currently hardcoded — switch to `var(--font-sans)`/`var(--font-mono)` for consistency with the rest of the token system).
- Update `fontSize` scale to match `typography.md` (add `xl`: 28px serif-friendly, `2xl`: 36px).
- Update `borderRadius` scale: `sm: 12px, md: 16px, lg: 20px, xl: 24px`, add `full: 9999px` (Tailwind's `rounded-full` already covers this — just confirm pill buttons use `rounded-full`, not a numeric radius).
- Update `spacing` scale's larger values if needed for the bigger card padding (`2xl`/`3xl` already cover 24–48px; no change needed there).
- Update `boxShadow`: replace `popup`/`card` values with `shadow.card`/`shadow.raised`/`shadow.modal` from `tokens.json`.

## Step 3 — Titlebar
**File:** `src/renderer/src/components/layout/Titlebar.tsx`
Class-only changes: `bg-surface` stays (now resolves to the cream token), `border-border` stays, hover classes move from dark hover tints to the new `surface.cardHover`-equivalent. No logic changes — same `window.api?.invoke(...)` calls.

## Step 4 — Sidebar
**File:** `src/renderer/src/components/layout/Sidebar.tsx`
- Widen from `w-[200px]` to `w-[220px]`.
- Active `NavLink` state: change `bg-primary/10 text-primary` → keep the same Tailwind pattern (it will now resolve to forest-green-tinted mint automatically once `--color-primary` changes) but consider swapping to an explicit `bg-[--color-mint-100]`-style utility if `bg-primary/10` doesn't read as mint enough — test visually and adjust opacity (try `/12` to `/16`) rather than introducing a new ad hoc color.
- Everything else (structure, `NAVIGATION` label, footer "Ready" dot) stays — just re-skin per `components.md` §1 and §8.

## Step 5 — Settings page
**File:** `src/renderer/src/pages/Settings.tsx`
- `<h1>` gets `font-serif` class added, size bumped to `text-2xl`/`text-3xl` per `typography.md`.
- Sub-nav buttons (`sections.map(...)`) restyle per `components.md` §1 (same pill/hover/active logic, new colors) — no state logic changes.
- All setting rows keep their exact structure (label + description + control) — only spacing (bump `p-md`→`p-lg`/`p-xl` inside cards) and color tokens change.
- Toggle switches (Analytics, Auto-Paste): restyle per `components.md` §5; if currently a plain styled `<input type="checkbox">` or custom div, confirm real toggle semantics exist (`role="switch"`/`aria-checked` or native checkbox) — fix if missing, this is an accessibility must, not just a visual one.

## Step 6 — History & Templates pages
**Files:** `src/renderer/src/pages/History.tsx`, `src/renderer/src/pages/Templates.tsx`
- Card-per-entry treatment restyles per `components.md` §4 (card).
- Templates' existing empty state ("Select a template to view details") restyles per the empty-state pattern in §4 — keep the copy, just re-skin icon/spacing/color.
- History's search input and provider filter restyle per `components.md` §6/§7.

## Step 7 — Toast
**File:** `src/renderer/src/components/ui/Toast.tsx`
- Remove the `.glass`/`.glass-border` dark-blur utility classes from the toast card; replace with `bg-surface-elevated border border-border shadow-raised` (new token-driven classes).
- Update `typeConfig` colors to the new `state.*` tokens.
- Retune the Framer Motion `transition` per `motion.md` (duration 0.22, offset `y: 8` instead of `y: 20`).

## Step 8 — Global CSS cleanup
**File:** `src/renderer/src/index.css`
- Remove or repurpose the `.glass`/`.glass-border` utilities if nothing else uses them after Step 7 (grep the codebase first — don't delete blind).
- Keep `.titlebar-drag`/`.titlebar-no-drag` and the `prefers-reduced-motion` block exactly as-is.
- Keep the `::selection` and scrollbar rules, just repoint their colors to the new tokens (they already reference `var(--color-*)`, so this may be a no-op once Step 1 lands).

## What NOT to touch
- `src/main/*`, `src/preload/*`, `src/services/*` — no IPC, provider, or data-layer changes.
- `stores/appStore.ts` logic — only consumed, not modified, unless a real bug is found (see the terminal-logging issue Irfan flagged earlier about Ollama vs. Groq provider mismatch — that's a separate bug-fix task, not part of this visual redesign; call it out separately if it resurfaces).
- Routing (`App.tsx`'s `<Routes>`) — structure unchanged, only the wrapping `<div>`'s classes (bg token) change.
