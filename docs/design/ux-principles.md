# UX Principles

These are the interaction values Wispr Flow's screenshots imply, translated into rules for PromptForge AI.

## 1. Calm over urgent
Nothing in the Wispr Flow screenshots shouts. No saturated red banners, no pulsing badges, no aggressive gradients. Status is conveyed through small, quiet signals (an 8px dot, a muted pill). **Apply to PromptForge:** the current `error` red should stay reserved for genuine failures (a bad API key, a connection test failure) — not for routine states. Loading states use text/spinner, never flashing or shaking.

## 2. One accent, used with intent
Forest green appears in exactly the places that matter: the progress ring's "you're doing well" signal, the streak heatmap's highest-value cells. It is not the color of every button and every link. **Apply to PromptForge:** stop using blue (`#3B82F6`) as the all-purpose interactive color. Reserve `accent.forest` for: the active nav item, primary/affirmative buttons, and focus rings. Everything else (secondary buttons, most links) stays neutral (`text.primary`/pill-gray).

## 3. Content is the interface, chrome recedes
Cards have almost no visual "framing" beyond a hairline border — the content itself (numbers, text, the heatmap) carries the visual interest. **Apply to PromptForge:** resist the urge to add borders, dividers, or background-color blocks purely for visual separation. Use whitespace first; add a hairline border only when whitespace alone doesn't disambiguate.

## 4. Editorial confidence in headings, plain confidence everywhere else
The serif headline treatment signals "this product has a point of view," while the sans, low-drama UI chrome signals "this product won't waste your time." **Apply to PromptForge:** every page keeps the pattern already present in `Settings.tsx` (H1 + one-line description) — just re-set the H1 in the serif display font and keep the description sans/secondary.

## 5. Every control explains itself in one line
Nearly every settings row in the screenshots pairs a short label with a one-line description directly beneath ("Data Retention" / "How long to keep prompt history"). PromptForge already does this. **Keep doing it** — don't compress it into label-only rows to save vertical space; the redesign has enough whitespace budget for it.

## 6. Respect existing user mental models
Don't reorganize navigation, rename features, or change where things live as part of this visual pass. Wispr Flow inspires *how things look*, not *what the product does* or *where users already expect to find things* in PromptForge AI.

## Content/tone standards (writing)
- Labels: short, concrete nouns ("Default Provider," not "Provider Preferences Configuration").
- Descriptions: one sentence, present tense, states what the setting *does*, not what it *is* ("Controls randomness" not "This is the temperature setting").
- Error messages: state what happened and what to do next ("Connection failed — check your API key and try again"), never just "Error."
- Empty states: one calm sentence + optional secondary hint, no exclamation points, no "Oops!"
