# Accessibility

Target: **WCAG 2.2 AA**. Every rule below is written to be testable — each has a pass/fail check, not just a principle.

## Contrast (verified against this spec's actual hex values, WCAG relative-luminance formula)
| Pair | Ratio | Pass/Fail |
|---|---|---|
| `text.primary` (#211F1B) on `canvas.base` (#F7F4EC) | 14.97:1 | Pass (AA + AAA, all sizes) |
| `text.primary` on `surface.card` (#FFFFFF) | 16.45:1 | Pass |
| `text.secondary` (#68625A) on `canvas.base` | 5.49:1 | Pass (AA body text) |
| `text.secondary` on `surface.card` | 6.03:1 | Pass |
| `text.tertiary` (#847D70) on `canvas.base` | 3.42:1 | Pass **large text only** (≥18px / ≥14px bold) — fail for body-size text |
| `text.tertiary` on `surface.card` | 3.75:1 | Pass large text only |
| `accent.lavenderText` (#5B3FA0) on `accent.lavenderBg` (#E9E1FA) | 6.24:1 | Pass |
| `accent.forest` (#2F4F42) on `canvas.base` | 8.24:1 | Pass |
| `text.inverse` (#FBF9F4) on `accent.forest` (filled button) | 8.61:1 | Pass |

**Acceptance test:** run any new color pairing through a contrast checker before shipping; anything below 4.5:1 for body text or 3:1 for large text/UI components is a fail, no exceptions.

## Focus
- [ ] Every interactive element (button, link, input, select, toggle, nav item, titlebar control) has a visible `:focus-visible` state using `state.focusRing` (`shadow.focusRing`, 3px, forest-tinted) — never `outline: none` without a replacement.
- [ ] Focus order follows visual/DOM order: Titlebar controls → Sidebar nav → main content → (within Settings) sub-nav → active panel controls.
- [ ] Focus is never trapped except inside an actual modal dialog, and a trapped focus always has a documented Esc-to-close exit.

## Keyboard
- [ ] All functionality reachable by mouse is reachable by keyboard alone (Tab/Shift+Tab/Enter/Space/Esc/Arrow keys where applicable to the specific control, per `components.md`).
- [ ] Hotkey-recording inputs (Settings → Hotkeys) clearly indicate "recording" state to screen readers (`aria-live` region announcing "Press a key combination"), not just a visual change.

## Color independence
- [ ] No status is communicated by color alone: the "Ready" dot, provider health dots, and hotkey enable/disable toggles all pair color with text, icon shape, or position (e.g. "Ready" has an adjacent text label; a disabled toggle also visibly moves its thumb and dims).

## Motion
- [ ] `prefers-reduced-motion: reduce` disables/shrinks all transitions to ~0.01ms (already implemented globally in `index.css` — confirm it still applies after the CSS variable refactor).

## Text and content
- [ ] Every icon-only control retains a real `aria-label` (titlebar buttons, toast dismiss) — don't lose these during the visual refactor.
- [ ] Form inputs keep programmatic `<label>` association (via `htmlFor`/`id` or wrapping) — a placeholder is never the only label.
- [ ] Error states (failed provider connection, invalid hotkey) are announced via an `aria-live="polite"` region in addition to the visual toast, so screen reader users don't miss transient messages.

## Testable QA gate (run before merging the redesign)
1. Tab through the entire Settings page with a mouse unplugged — every control must be operable.
2. Run axe DevTools (or equivalent) on Settings, History, and Templates — zero critical/serious violations.
3. Zoom to 200% — no text truncation, no overlapping controls.
4. Toggle OS-level "reduce motion" — confirm all transitions collapse.
5. Toggle OS-level high-contrast/forced-colors mode if targeting Windows — confirm focus rings and borders remain visible (forced-colors mode ignores custom colors, so rely on real borders/outlines, not color alone, per the rules above).
