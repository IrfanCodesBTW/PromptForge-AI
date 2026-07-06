# Iconography

## Library
No change needed. PromptForge AI already uses **lucide-react**, and Wispr Flow's icons (thin, single-weight line icons — see the sidebar glyphs for Home/Insights/Dictionary/Snippets/Style/Transforms/Scratchpad, and the Settings icons for General/System/Vibe coding/Experimental) are visually consistent with Lucide's style. No new icon dependency is required.

## Rules
- **Stroke width:** 1.5 for all icons ≤ 20px (matches the current `<Icon size={16} strokeWidth={1.5} />` pattern in `Sidebar.tsx` — keep it).
- **Size scale:** 14px (inline with `xs`/`sm` text), 16px (nav items, inline buttons — default), 18–20px (card headers, empty states), 24px (empty-state hero icon, large stat context).
- **Color:** icons inherit `currentColor` from their text-color context (`text.secondary` default, `text.primary` on hover/active, `accent.forest` when representing an active/selected state) — never hardcode a separate icon color token.
- **No filled icon variants.** Everything stays outline/stroke style, consistent with Wispr Flow's line-icon sidebar.
- **No icon-only buttons without an accessible label.** Every icon-only control (titlebar minimize/maximize/close, toast dismiss) keeps its existing `aria-label`.

## Anti-patterns
- Don't mix stroke widths within the same list/nav (all sidebar icons must share one stroke width).
- Don't use icons as the sole means of conveying status (pair with color + text/aria-label per `accessibility.md`).
