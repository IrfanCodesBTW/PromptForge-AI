# Master Prompt: Redesign PromptForge AI's UI to a Wispr-Flow-inspired design system

Paste everything below into Cursor / Windsurf / Claude Code as a single task, with `design.md`, `tokens.json`, `typography.md`, `components.md`, `motion.md`, `icons.md`, `layout.md`, `accessibility.md`, `desktop-guidelines.md`, `implementation.md`, `ux-principles.md`, and `design-review-checklist.md` open/attached in the same workspace.

---

## Context

PromptForge AI is an Electron + React 18 + TypeScript + Tailwind desktop app (renderer at `src/renderer/src/`). It currently uses a dark, generic-SaaS visual style (near-black canvas, blue accent, small border radii) driven by CSS custom properties in `src/renderer/src/index.css` and consumed by `tailwind.config.js`. This is a **visual redesign only** — no feature, IPC, routing, or data-model changes.

The target aesthetic is Wispr Flow's design language: a warm cream canvas, a single forest-green accent used sparingly, an editorial serif for headings/large numbers paired with a clean sans for everything functional, pill-shaped buttons/badges, large soft-radius cards, hairline borders, and generous whitespace. The full rationale, token values, and per-component rules are in the attached design system files — read `design.md` first for the "why," then `tokens.json` for exact values, then `implementation.md` for the file-by-file plan.

## Goal
Migrate the token layer and every existing component/page to the new design system while preserving 100% of current functionality, IPC calls, state logic, and routing.

## Non-negotiable constraints
1. Do not modify anything in `src/main/`, `src/preload/`, or `src/services/`.
2. Do not change any IPC channel name, `window.api.invoke(...)` call, or its arguments.
3. Do not change routes, component props, or state management logic in `stores/`.
4. Do not remove or weaken any existing accessibility attribute (`aria-label`, focus handling, `prefers-reduced-motion` support).
5. Every interactive element must retain (or gain, if missing) default/hover/focus-visible/active/disabled states per `components.md` — this is a testable acceptance criterion, not optional polish.
6. All color, spacing, radius, and typography changes must trace back to a token in `tokens.json` — no new hardcoded hex values or one-off pixel values introduced during implementation.

## Execution plan (do these in order; treat each as its own commit/step)

**Step 1 — Token layer.** Rewrite the `:root` and `[data-theme="dark"]` blocks in `src/renderer/src/index.css` per `implementation.md` Step 1. Light (cream/forest) becomes the new default under `:root`; dark becomes a real alternate palette (not the old blue-on-navy) under `[data-theme="dark"]`. Add `--font-serif` alongside the existing `--font-sans`/`--font-mono` variables.

**Step 2 — Tailwind config.** Update `tailwind.config.js` per `implementation.md` Step 2: point `fontFamily.sans`/`mono` at the CSS variables instead of hardcoded stacks, add `fontFamily.serif`, update the `fontSize`, `borderRadius`, and `boxShadow` scales to match `typography.md`/`tokens.json`.

**Step 3 — Titlebar.** Restyle `src/renderer/src/components/layout/Titlebar.tsx` per `desktop-guidelines.md` — class changes only, same `window.api?.invoke(...)` calls, same drag-region classes.

**Step 4 — Sidebar.** Restyle `src/renderer/src/components/layout/Sidebar.tsx` per `implementation.md` Step 4 and `components.md` §1/§8 — widen to 220px, re-skin active/hover states, keep the same `NavLink` structure and footer status dot.

**Step 5 — Settings page.** Restyle `src/renderer/src/pages/Settings.tsx` per `implementation.md` Step 5: serif `<h1>`, re-skinned sub-nav, re-skinned cards/toggles/selects/inputs per `components.md` §4–§7. If any toggle lacks real `role="switch"`/`aria-checked` or checkbox semantics, fix that as part of this step (accessibility must, per `accessibility.md`).

**Step 6 — History & Templates pages.** Restyle `src/renderer/src/pages/History.tsx` and `src/renderer/src/pages/Templates.tsx` per `implementation.md` Step 6 — card and empty-state treatment, search/filter input restyle. Keep all existing copy.

**Step 7 — Toast.** Restyle `src/renderer/src/components/ui/Toast.tsx` per `implementation.md` Step 7 and `motion.md` — remove the glass/blur dark treatment, adopt token-driven surface/border/shadow, retune the Framer Motion transition (duration 220ms, `y: 8` entrance offset, standard easing).

**Step 8 — Cleanup.** Remove now-unused `.glass`/`.glass-border` utility classes from `index.css` if nothing else references them (grep first). Confirm `.titlebar-drag`/`.titlebar-no-drag` and the `prefers-reduced-motion` block are untouched.

## After implementation
Run every item in `design-review-checklist.md` and report the results (pass/fail per section) before considering this done. Specifically confirm:
- No blue (`#3B82F6`/`#2563EB`) remains anywhere in the codebase.
- All contrast pairs meet the ratios documented in `accessibility.md`.
- Window dragging, minimize, maximize, and close all still function exactly as before.
- `git diff --stat` shows changes concentrated only in the files listed in the execution plan above.

## Output format
Work through the steps in order. After each step, briefly state what changed and which file(s) were touched. At the end, produce the checklist results from `design-review-checklist.md` as a final summary.
