# PromptForge AI — Feature Specification

> A local-first Electron desktop app that enhances AI prompts via global hotkeys.

---

## 1. Prompt Enhancement Modes

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

Core transformation engine offering 9 distinct modes to process selected text. Each mode applies a specialized system prompt and formatting strategy to transform user input into higher-quality output.

### Modes

| Mode | Behavior |
|------|----------|
| **Enhance** | Rewrite prompt professionally, improve clarity, add missing context |
| **Expand** | Expand a brief prompt into detailed, structured instructions |
| **Compress** | Reduce verbose prompt to concise version preserving core intent |
| **Explain** | Explain what a prompt does and suggest improvements |
| **Translate** | Translate prompt to another language while preserving intent and structure |
| **Grammar Fix** | Fix grammar/spelling without changing meaning or tone |
| **Convert to PRD** | Transform rough notes into a structured Product Requirements Document |
| **Convert to Markdown** | Convert any text to well-formatted markdown with proper headings, lists, and code blocks |
| **Notes to Prompt** | Convert rough notes into a proper, well-structured AI prompt |

### User Story

> As a user, I want to select text anywhere on my system, trigger an enhancement mode, and receive a transformed version in my clipboard — so I can quickly improve prompts without leaving my current workflow.

### Acceptance Criteria

- [ ] All 9 modes are accessible via hotkey, command palette, or tray menu
- [ ] Each mode produces output that is measurably different from input (not a no-op)
- [ ] Enhancement preserves the user's original language unless Translate mode is used
- [ ] Output is copied to clipboard automatically after processing
- [ ] A toast notification confirms completion with mode name and token count
- [ ] Processing shows a loading indicator (spinner or progress in tray)
- [ ] Errors (API failure, empty input) display user-friendly messages
- [ ] Each mode works with inputs ranging from 1 word to 4000 tokens

---

## 2. Global Hotkeys

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

System-wide keyboard shortcuts that capture selected text from any application, process it through the chosen enhancement mode, and return the result to the clipboard. Works regardless of which application has focus.

### Default Keybindings

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Enhance Prompt | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Expand Prompt | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Compress Prompt | `Ctrl+Shift+K` | `Cmd+Shift+K` |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Explain Prompt | `Ctrl+Shift+/` | `Cmd+Shift+/` |
| Translate | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Grammar Fix | `Ctrl+Shift+G` | `Cmd+Shift+G` |

### Features

- Fully customizable key bindings via Settings
- Conflict detection with OS-level and common application shortcuts
- Enable/disable individual hotkeys without removing the binding
- Visual indicator when a hotkey is successfully registered vs. conflicting

### User Story

> As a user, I want to press a keyboard shortcut from any application to instantly enhance my selected text — so I never need to switch windows or break my flow.

### Acceptance Criteria

- [ ] Hotkeys register globally and work when the app is minimized to tray
- [ ] Selected text is captured from the active application via clipboard read
- [ ] If no text is selected, a notification informs the user ("No text selected")
- [ ] Hotkeys work across all major platforms (Windows, macOS, Linux)
- [ ] Conflict detection warns user during customization if a binding clashes
- [ ] Hotkeys can be individually enabled/disabled from settings
- [ ] Custom bindings persist across app restarts
- [ ] Hotkey registration fails gracefully if another app holds the binding

---

## 3. Smart Context Detection

**Priority:** P1 (Important)  
**Version:** v1.5

### Description

Automatic classification of selected text into domain categories using keyword analysis and heuristics. The detected category selects the optimal system prompt template for enhancement, improving output relevance without manual mode selection.

### Categories & Detection Keywords

| Category | Keywords |
|----------|----------|
| Coding | function, API, debug, code, error, implement, class, module, bug |
| UI/UX | design, layout, component, responsive, color, wireframe, prototype |
| Research | analyze, compare, study, literature, findings, hypothesis, data |
| Startup | pitch, MVP, market, investors, funding, traction, runway |
| Marketing | campaign, audience, brand, conversion, SEO, funnel, engagement |
| Writing | essay, article, story, paragraph, draft, narrative, thesis |
| Automation | workflow, script, automate, pipeline, cron, trigger, schedule |
| Image Generation | image, visual, illustration, style, render, portrait, scene |

### Fallback Behavior

If classification confidence is below 0.6, apply the **General** enhancement template (no domain-specific augmentation).

### User Story

> As a user, I want the app to automatically detect what kind of text I'm enhancing — so it applies the most relevant template without me manually choosing a category every time.

### Acceptance Criteria

- [ ] Text is classified into one of 8 categories or falls back to General
- [ ] Classification runs in < 50ms for texts up to 2000 tokens
- [ ] Confidence score is calculated and visible in history metadata
- [ ] Fallback to General triggers when confidence < 0.6
- [ ] User can override detected category before processing
- [ ] Detection works with mixed-language input
- [ ] Category detection improves enhancement quality vs. uncategorized baseline
- [ ] User can disable auto-detection and always use a fixed category

---

## 4. AI Provider Management

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

Multi-provider AI backend supporting both local and cloud LLM services. Users configure API keys, select models, and define fallback chains for reliability. All credentials are stored locally with encryption.

### Supported Providers

**Local Providers:**
- Ollama
- LM Studio

**Cloud Providers:**
- Groq
- OpenAI
- Anthropic
- Google Gemini
- OpenRouter

**Custom:**
- Any OpenAI-compatible endpoint (base URL + API key)

### Features

- Configure multiple providers with encrypted API key storage
- Set default provider and model
- Fallback chain: if primary provider fails, automatically try next in chain
- Streaming support for real-time token-by-token feedback
- Provider health checks (ping endpoint, verify key validity)
- Per-provider model selection with favorites
- Cost tracking per provider (estimated token usage)

### User Story

> As a user, I want to configure multiple AI providers and set a fallback order — so my prompt enhancement never fails even if one provider is down or rate-limited.

### Acceptance Criteria

- [ ] User can add/edit/remove provider configurations
- [ ] API keys are stored encrypted in local storage (never sent to external servers)
- [ ] Default provider is used for all operations unless overridden
- [ ] Fallback chain activates automatically on provider failure (timeout, 429, 5xx)
- [ ] Health check validates API key and endpoint reachability
- [ ] Streaming responses display tokens in real-time in the UI
- [ ] Local providers (Ollama, LM Studio) work without internet
- [ ] Custom OpenAI-compatible endpoints can be added with base URL
- [ ] Provider status (healthy/degraded/offline) is visible in settings

---

## 5. Prompt Templates

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

A template system powering each enhancement mode. Includes 11 built-in templates covering common domains, plus a custom template editor for user-defined workflows. Templates use variable interpolation for dynamic prompt construction.

### Built-in Templates (11)

1. Coding
2. UI/UX
3. Product Requirements
4. Research
5. Marketing
6. SEO
7. Startup
8. Business
9. Automation
10. Image Generation
11. Video Generation

### Custom Template Schema

```json
{
  "name": "Template Name",
  "description": "What this template does",
  "category": "coding",
  "system_prompt": "You are a...",
  "user_prompt_template": "Enhance this {{category}} prompt: {{input}}",
  "variables": ["category", "input", "language"]
}
```

### Features

- Create, edit, and delete custom templates
- Import/export templates as JSON files
- Template variables with configurable defaults
- Built-in templates are read-only but can be duplicated and customized
- Template preview with sample input before saving

### User Story

> As a user, I want to create custom prompt templates for my specific workflows — so I can build a personal library of enhancement strategies tailored to my domain.

### Acceptance Criteria

- [ ] All 11 built-in templates are available on first launch
- [ ] Custom templates support the full JSON schema with variables
- [ ] Variables in `user_prompt_template` are interpolated at runtime
- [ ] Templates can be imported/exported as `.json` files
- [ ] Duplicate built-in templates to create editable copies
- [ ] Templates are searchable by name, category, and description
- [ ] Invalid template schema shows validation errors on save
- [ ] Templates persist locally across app updates

---

## 6. Prompt History

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

Persistent local storage of all prompt transformations with rich metadata. Enables users to review, search, favorite, and re-use past enhancements. All data stored locally in SQLite.

### Stored Metadata Per Entry

| Field | Description |
|-------|-------------|
| `original_text` | The input text before enhancement |
| `enhanced_text` | The output text after enhancement |
| `provider` | AI provider used (e.g., "openai") |
| `model` | Specific model (e.g., "gpt-4o") |
| `template` | Template name applied |
| `category` | Detected or selected category |
| `token_count` | Input + output tokens consumed |
| `latency_ms` | Processing time in milliseconds |
| `timestamp` | ISO 8601 datetime of enhancement |

### Features

- Full-text search across original and enhanced text
- Filter by date range, provider, category, or template
- Mark entries as favorites for quick access
- Tag entries with custom labels
- Export history to JSON or CSV
- Bulk delete with multi-select
- Configurable retention period (default: 90 days, option: forever)

### User Story

> As a user, I want to browse and search my enhancement history — so I can find and re-use previous prompts without re-creating them from scratch.

### Acceptance Criteria

- [ ] Every enhancement operation creates a history entry automatically
- [ ] Full-text search returns results in < 200ms for up to 10,000 entries
- [ ] Filters (date, provider, category) are combinable
- [ ] Favorites are accessible from a dedicated tab
- [ ] Tags support creation, assignment, and filtering
- [ ] Export produces valid JSON and CSV files
- [ ] Bulk delete requires confirmation dialog
- [ ] History retention auto-deletes entries older than configured period
- [ ] History data is stored in local SQLite database (no cloud sync)

---

## 7. Floating Command Palette

**Priority:** P1 (Important)  
**Version:** v1.5

### Description

A global overlay window triggered by hotkey that provides fuzzy-search access to all app actions. Appears as a floating, always-on-top panel similar to Spotlight/Raycast. Disappears on action selection or Escape.

### Trigger

`Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (macOS)

### Available Actions

- All 9 enhancement modes
- Open Settings
- View History
- Switch AI provider
- Switch model
- Toggle auto-paste
- Custom user-defined actions

### Features

- Fuzzy search across all registered actions
- Recent actions pinned at the top (last 5 used)
- Full keyboard navigation (Arrow keys + Enter to select)
- Category grouping (Modes, Settings, History, Providers)
- Custom actions definable by user
- Appears centered on active monitor
- Auto-dismisses on focus loss

### User Story

> As a user, I want a quick command palette accessible from anywhere — so I can trigger any action without remembering individual hotkeys for each mode.

### Acceptance Criteria

- [ ] Palette appears within 100ms of hotkey press
- [ ] Fuzzy search matches action names, descriptions, and aliases
- [ ] Arrow keys navigate results; Enter executes selected action
- [ ] Escape or clicking outside dismisses the palette
- [ ] Recent actions (last 5) appear at top before search input
- [ ] Actions are grouped by category with visual separators
- [ ] Palette appears on the monitor where the cursor is located
- [ ] Custom actions can be added with name + command mapping
- [ ] Palette handles 100+ registered actions without performance lag

---

## 8. Settings & Preferences

**Priority:** P0 (MVP)  
**Version:** v1.0

### Description

Centralized configuration interface for all app behavior. Settings persist locally in a JSON config file and sync across app restarts. Provides sensible defaults for all options.

### Configurable Options

| Setting | Default | Options |
|---------|---------|---------|
| Theme | System | Dark, Light, System |
| AI Provider | — | Configured providers |
| Default Model | — | Per-provider model list |
| Temperature | 0.7 | 0.0 – 2.0 (slider) |
| Max Tokens | 2048 | 256 – 8192 |
| Global Hotkeys | See §2 | Customizable bindings |
| Auto-Paste | On | On / Off |
| Clipboard Timeout | 30s | 10s – 300s / Disabled |
| Language | English | System languages |
| Start with System | Off | On / Off |
| Minimize to Tray | On | On / Off |
| Notifications | On | On / Off / Errors Only |
| History Retention | 90 days | 30 / 60 / 90 / 365 / Forever |

### User Story

> As a user, I want a single settings page where I can configure all app behavior — so I can tailor PromptForge AI to my workflow preferences without editing config files.

### Acceptance Criteria

- [ ] All settings listed above are configurable via the UI
- [ ] Changes take effect immediately without app restart (except system startup)
- [ ] Settings persist in local JSON file across sessions
- [ ] Reset to defaults button available per-section and globally
- [ ] Invalid values (e.g., temperature > 2.0) show inline validation errors
- [ ] Theme changes apply instantly across all windows
- [ ] Hotkey customization shows conflict warnings in real-time
- [ ] Settings are importable/exportable for backup and device migration

---

## 10. Floating Streaming Preview Window

**Priority:** P0  
**Version:** v1.5

### Description

A lightweight, transparent, frameless floating overlay window (`420×420px`) that displays live streaming token output near the cursor position when global hotkeys are triggered. Enables users to inspect, accept, reject, or re-run an enhancement before any text is written to the system clipboard.

### User Story

> As a user, I want to preview AI enhancement streaming output in real-time near my cursor before committing it to my clipboard — so I can accept, reject, or refine the result without overwriting my clipboard prematurely.

### Acceptance Criteria

- [x] Sized 420px wide with adaptive height up to 420px, positioned near current cursor point
- [x] Streams token chunks incrementally with a blinking cursor indicator
- [x] Displays active AI provider name and total latency pill badge
- [x] Exposes explicit Accept (Enter), Reject (Escape), and Re-run (Ctrl+R) actions
- [x] Clipboard write and optional auto-paste occur ONLY when Accept is triggered
- [x] Supports hybrid fallback notice when streaming is unsupported
- [x] Feature-flagged behind `preview_window_enabled` setting (defaults to off)

---

## 11. Persona Profiles System

**Priority:** P0  
**Version:** v1.5

### Description

Custom prompt identity profiles that inject structured persona constraints (tone, format rules, system prompt injection) into every prompt enhancement. Managed via a dedicated Settings tab and accessible from the system tray menu.

### User Story

> As a user, I want to define and switch active persona profiles (e.g. Developer, Executive, Creative) — so my prompt enhancements automatically adopt my preferred tone, format rules, and role identities.

### Acceptance Criteria

- [x] SQLite `personas` table with single-default enforcement at application layer
- [x] Built-in personas (General, Developer, Executive, Creative, Social) seeded by default
- [x] Full CRUD via dedicated Settings → Personas tab with live preview panel
- [x] System tray "Persona" radio-item submenu for quick default selection
- [x] Prepends persona `systemPromptInjection` to system prompts using `---` divider
- [x] Respects `persona_override_allowed` flag on templates

---

## 12. Smart History Stack + FTS4 Full-Text Search

**Priority:** P0  
**Version:** v1.5

### Description

A speed-first quick-search popup (`Ctrl+Shift+H`) powered by SQLite FTS4 inverted index search, featuring side-by-side word diffs, debounced search, matched term highlighting, keyboard navigation, and one-keystroke re-copy.

### User Story

> As a user, I want to quickly search my past prompt enhancements using full-text search (`Ctrl+Shift+H`) and copy or inspect diffs — so I can instantly reuse high-quality prompt outputs.

### Acceptance Criteria

- [x] `prompt_history_fts` virtual table using SQLite FTS4 with term-frequency ranking
- [x] Transparent, frameless `560×480px` popup window triggered via `Ctrl+Shift+H`
- [x] Side-by-side word diff view highlighting additions and deletions
- [x] Matched search terms highlighted with `<mark>` style
- [x] Actions: Re-copy (clipboard + toast), Use as Base (starts refinement session), Delete (with 4s undo toast)
- [x] Full keyboard navigation (Up/Down/Enter/Delete/Escape)
- [x] Shared FTS4 search backend across both quick picker popup and main History tab

---

## 13. Multi-Turn Conversational Refinement Loop

**Priority:** P0  
**Version:** v1.5

### Description

An interactive multi-turn prompt refinement capability embedded within the floating preview window. Users can type follow-up instructions (e.g. "make it more concise", "add error handling") to conversationally evolve an enhanced prompt output before saving.

### User Story

> As a user, I want to refine an enhanced prompt by sending follow-up instructions inside the preview window — so I can tweak and perfect the generated prompt iteratively.

### Acceptance Criteria

- [x] In-memory `RefinementSessionManager` holding active sessions with 5-minute inactivity auto-expiry
- [x] Sub-800 token prompt budget assembling original prompt, current output, turn history, instruction, and active persona
- [x] Real-time streaming response chunks (`REFINEMENT_TOKEN_CHUNK`) displayed in preview window
- [x] Embedded 36px chat input bar with auto-focus and turn history thread view
- [x] "Use as Base" in History Picker initializes a new refinement session from past history entries
- [x] Configurable session timeout in Settings (`refinementSessionTimeoutMinutes`)

---

## Version Roadmap

### v1.0 — MVP

| Feature | Priority |
|---------|----------|
| Prompt Enhancement Modes (9 modes) | P0 |
| Global Hotkeys | P0 |
| AI Provider Management | P0 |
| Prompt Templates (built-in + custom) | P0 |
| Prompt History | P0 |
| Settings & Preferences | P0 |

### v1.5 — Intelligence

| Feature | Priority | Status |
|---------|----------|--------|
| Floating Streaming Preview Window | P0 | Completed |
| Persona Profiles System | P0 | Completed |
| Smart History Stack + FTS4 Search | P0 | Completed |
| Multi-Turn Conversational Refinement Loop | P0 | Completed |

### v2.0 — Power User

| Feature | Priority |
|---------|----------|
| Prompt Chains (multi-step pipelines) | P2 |
| Team Sharing (local network sync) | P2 |
| Plugin System (custom modes via JS) | P2 |
| Voice Input Mode | P2 |
| Batch Processing (multiple prompts) | P2 |

---

## Technical Notes

- **Runtime:** Electron + Node.js
- **Frontend:** React + Tailwind CSS
- **Storage:** SQLite (history), JSON (settings, templates)
- **Security:** API keys encrypted at rest via OS keychain (Keytar)
- **Updates:** Auto-update via electron-updater
- **Platforms:** Windows, macOS, Linux
