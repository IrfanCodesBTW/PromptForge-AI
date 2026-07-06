# Design Review Checklist
### Run before merging the Wispr-Flow-inspired redesign

## Tokens
- [ ] `index.css` `:root` matches `tokens.json` exactly (no leftover hardcoded hex values in components)
- [ ] `tailwind.config.js` colors/radius/shadow/fontFamily all resolve through CSS variables, none hardcoded
- [ ] Dark mode variant exists and uses the same forest-green accent + serif/sans split, not the old blue palette

## Typography
- [ ] Page titles and large stat numbers use `font-serif`; everything else uses `font-sans`
- [ ] No serif text is set to `bold` (700)
- [ ] No body-size text uses `text.tertiary`

## Color
- [ ] Blue (`#3B82F6`/`#2563EB`) no longer appears anywhere in the codebase (grep for it)
- [ ] Forest green is the only saturated accent used for interactive states
- [ ] Canvas is warm off-white, not pure white and not dark, in light mode

## Components
- [ ] Every button, toggle, input, and nav item has default/hover/focus-visible/active/disabled states styled (loading/error where applicable) per `components.md`
- [ ] Pill buttons use `rounded-full`; cards use `rounded-lg`/`rounded-xl` (20–24px), nothing below 8px anywhere
- [ ] Toast restyled off `.glass`, using token-driven surface/border/shadow

## Accessibility (see `accessibility.md` for full detail)
- [ ] All contrast pairs verified ≥4.5:1 body / ≥3:1 large text
- [ ] Full keyboard walkthrough of Settings/History/Templates passes
- [ ] axe scan: zero critical/serious issues
- [ ] `prefers-reduced-motion` confirmed working after CSS changes
- [ ] Every icon-only control retains its `aria-label`

## Desktop chrome
- [ ] Titlebar drag region still functional (test actual window dragging, not just visual)
- [ ] Minimize/maximize/close still call the same IPC methods, visuals only changed
- [ ] Window resize behavior unchanged (sidebar fixed-width, content scrolls independently)

## Scope discipline
- [ ] No IPC channel, route, or data-model changes crept in
- [ ] No feature added/removed/renamed
- [ ] `git diff --stat` shows changes concentrated in `index.css`, `tailwind.config.js`, and component/page files only — not in `src/main`, `src/preload`, or `src/services`

## Sign-off
- [ ] Compare final app screenshots side-by-side with the three Wispr Flow reference screenshots — canvas warmth, accent restraint, and serif/sans split should all be visually recognizable
