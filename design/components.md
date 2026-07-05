# Components

Every component below must define default, hover, focus-visible, active, disabled, loading, and error states where applicable. Skip a state only if the component genuinely cannot enter it (e.g. a static badge has no "loading" state).

---

## 1. Sidebar navigation item
**Maps to:** `Sidebar.tsx`

**Anatomy:** icon (16px, stroke 1.5) + label (sans, 13px) in a horizontal row, full-width, `radius.pill` on the active/hover pill (not `radius.md` as today — Wispr's active row is a soft full pill, not a boxed rectangle... in practice a large `radius.md`/`radius.lg` rectangle reads fine too since the sidebar itself isn't a pill; use `radius.md` here for the row and reserve `radius.pill` for buttons/badges).

| State | Treatment |
|---|---|
| Default | `text.secondary`, transparent bg |
| Hover | `text.primary`, bg `surface.cardHover` |
| Active | `text.primary`, bg `accent.mint100`, icon tinted `accent.forest` |
| Focus-visible | 2px `state.focusRing` outline, 2px offset |
| Disabled | n/a (nav items are never disabled in this app) |

**Keyboard:** Tab reaches each item in DOM order; Enter/Space activates; arrow-key roving not required (native `<a>`/`NavLink>` semantics via Tab is sufficient here).
**Touch/pointer:** whole row is the hit target, min height 40px.

---

## 2. Pill button (secondary/utility)
**Maps to:** "Change," "Test Connection," "Save," window-adjacent action buttons

**Anatomy:** height 36px, `paddingX` 16px, `radius.pill`, optional leading icon 16px.

| State | Treatment |
|---|---|
| Default | bg `component.pillButton.bg` (#F1EDE3), text `text.primary` |
| Hover | bg `component.pillButton.bgHover` (#E8E3D6) |
| Focus-visible | `shadow.focusRing` + 2px outline |
| Active/pressed | bg darkens one more step, scale 0.98 (see `motion.md`) |
| Disabled | bg `state.disabledBg`, text `state.disabledText`, cursor not-allowed, no hover/active transform |
| Loading | icon replaced with a 14px spinner, label stays, button width does not reflow |

**Keyboard:** standard `<button>` semantics; Enter/Space triggers.

---

## 3. Primary button (affirmative action)
**Maps to:** "Save" in Settings → Providers, primary CTA in any future dialog

**Anatomy:** same geometry as the pill button but filled with `accent.forest`, text `text.inverse`.

| State | Treatment |
|---|---|
| Default | bg `accent.forest`, text `text.inverse` |
| Hover | bg `accent.forestHover` |
| Focus-visible | `shadow.focusRing` (ring color still forest, offset visible against the fill) |
| Active | scale 0.98 |
| Disabled | bg `state.disabledBg`, text `state.disabledText` |
| Loading | spinner in `text.inverse`, label optionally replaced with "Saving…" |
| Error (e.g. failed test connection) | button briefly reverts to default and a toast/inline message carries the error — the button itself does not turn red |

---

## 4. Card
**Maps to:** every settings panel block, history entry, template detail panel

**Anatomy:** `surface.card` bg, `radius.lg` (20px), 1px `surface.border`, `shadow.card`, internal padding `layout.cardPadding` (24px).

| State | Treatment |
|---|---|
| Default | as above |
| Hover (only if the card itself is clickable, e.g. a history row) | `shadow.raised`, border `surface.borderStrong` |
| Focus-visible (clickable cards) | `shadow.focusRing` |
| Empty | see empty-state pattern below |

**Long-content/overflow:** card height is intrinsic (grows with content); never fixed-height with internal scroll except in the History list, which scrolls as a region with its own scrollbar styling from `layout.md`.
**Empty state:** icon (24px, `text.tertiary`) + one-line message in `text.secondary` + optional one-line sub-message in `text.tertiary`, centered, generous vertical padding (`space.9`). Matches the existing Templates "Select a template to view details" pattern — keep that copy pattern, just re-skin it.

---

## 5. Toggle switch
**Maps to:** Analytics toggle, Auto-Paste toggle, per-hotkey enable switch

| State | Treatment |
|---|---|
| Off | track `surface.cardMuted`, thumb white, border `surface.border` |
| On | track `accent.forest`, thumb white |
| Hover | track darkens one step |
| Focus-visible | `shadow.focusRing` around the whole control |
| Disabled | track `state.disabledBg`, thumb `state.disabledText`, 60% opacity overall |

**Keyboard:** must be a real `<button role="switch" aria-checked>` or `<input type="checkbox">` — Space toggles, Tab/Shift+Tab moves focus in/out. Never a `<div>` with an onClick only.

---

## 6. Select / dropdown
**Maps to:** Data Retention, Default Provider, Model selectors

Keep native `<select>` semantics (as today) but restyle: `radius.sm` (12px), `surface.border`, `surface.card` bg, chevron icon 14px in `text.secondary`.

| State | Treatment |
|---|---|
| Default | as above |
| Hover | border `surface.borderStrong` |
| Focus-visible | `shadow.focusRing`, border `accent.forest` |
| Disabled | bg `state.disabledBg`, text `state.disabledText` |
| Error | border `state.error`, helper text below in `state.error` |

---

## 7. Text input
**Maps to:** API Key field

Same treatment as select. Placeholder text in `text.tertiary` at ≥14px (per the AA rule in `typography.md`, since tertiary fails at small sizes).

---

## 8. Badge / status dot
**Maps to:** "Ready" status dot in sidebar footer, provider health dots, notification dot

- Status dot: 8px circle, `state.success` (green) / `state.error` (red) / `state.warning` (amber), no ring, no animation.
- Notification dot (unread count style, seen top-right of Wispr's settings nav items): 8px circle, `accent.red`, positioned top-right of the icon/label it's attached to, `aria-label` conveys the count/meaning to screen readers (never color-only).

---

## 9. "Pro"-style plan/tag badge
**Maps to:** could be reused for provider tags ("local" / "cloud") seen in Provider Status

Pill (`radius.pill`), `paddingX` 8px, `paddingY` 2px, `font.size.xs`, `font.weight.medium`. Default palette: `accent.lavenderBg` / `accent.lavenderText` for a "highlight" tag; `surface.cardMuted` / `text.secondary` for a neutral tag (e.g. "local"/"cloud" labels).

---

## 10. Stat card (Insights-style)
**Not present in PromptForge today — optional future component if History/usage stats are added.**

Big serif number (`font.size.displaySm`/`displayMd`) + sans label beneath in `text.secondary`, `font.size.xs`, uppercase, letter-spacing 0.04em. Optional circular progress ring in `accent.forest` on `accent.mint100` track.

---

## 11. Toast
**Maps to:** existing `Toast.tsx` — keep the component logic, restyle only.

`surface.card` bg (replace the current `glass`/dark blur treatment), `radius.md`, `shadow.raised`, colored left icon per type (`state.success`/`error`/`warning`/`state.focusRing`-adjacent for info), border `surface.border`. Motion: keep the existing slide/scale enter-exit from Framer Motion, just retune easing per `motion.md`.

---

## 12. Modal / settings dialog
**Maps to:** could apply to any future dialog (Wispr's Settings renders as an overlay dialog; PromptForge's Settings today is a full page — keep it a full page, don't force a modal pattern that doesn't exist in the current IA).

If a modal is ever introduced: `overlayScrim` background, `surface.raised` panel, `radius.xl` (24px), `shadow.modal`, focus-trapped, Esc closes, initial focus on the first interactive element.

---

## 13. Titlebar / window chrome
See `desktop-guidelines.md` for full detail — restyle only, same IPC calls (`promptforge:window:toggle`, `promptforge:app:quit`).
