# Changelog

All notable changes to PromptForge AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0](https://github.com/IrfanCodesBTW/PromptForge-AI/compare/promptforge-ai-v1.2.1...promptforge-ai-v2.0.0) (2026-07-23)


### ⚠ BREAKING CHANGES

* none -- preview window is feature-flagged off by default

### Features

* v1.5.0 Intelligence release -- floating preview window, persona profiles, smart history FTS4, multi-turn refinement ([2970ab2](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/2970ab2662879b7a11b8cdece13b780d97ee206c))

## [1.5.0](https://github.com/IrfanCodesBTW/PromptForge-AI/compare/promptforge-ai-v1.2.1...promptforge-ai-v1.5.0) (2026-07-23)

### Features — Intelligence Release

* **Floating Streaming Preview Window**: Live token streaming overlay (`420×420px`) positioned near the cursor with blinking cursor, latency pill, Accept/Reject/Re-run controls, and hybrid streaming fallback.
* **Persona Profiles System**: Custom prompt identity profiles (tone, format rules, system prompt injection) backed by SQLite `personas` table, tray radio-item menu, and dedicated Settings tab.
* **Smart History Stack + FTS4 Search**: Speed-first history picker (`Ctrl+Shift+H`) powered by SQLite FTS4 inverted-index search with side-by-side word diffs, term highlighting, and 4s undo delete.
* **Multi-Turn Conversational Refinement Loop**: Interactive in-memory multi-turn refinement sessions with 5-minute inactivity auto-expiry, embedded preview chat input bar, and sub-800 token prompt budgeting.

### Bug Fixes

* IPC preload channel whitelist — all Refinement channels and WINDOW_OPEN were silently blocked
* `settings.get()` undefined runtime crash on REFINEMENT_SEND_INSTRUCTION handler
* `HistoryPickerApp.tsx` missing `HistoryEntry` type import (TS compile error)
* `PreviewApp.tsx` — `REFINEMENT_START` received enhanced text as `originalText` instead of source text
* New `PREVIEW_SOURCE_TEXT` channel added to forward original selected text to preview renderer

---

## [1.2.1](https://github.com/IrfanCodesBTW/PromptForge-AI/compare/promptforge-ai-v1.2.0...promptforge-ai-v1.2.1) (2026-07-06)


### Bug Fixes

* correct electron-builder publish repo details and skip auto-publish ([9c7f95a](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/9c7f95a6b9ddd050ba67f9dc8877e2d5a22e585b))


## [1.2.0](https://github.com/IrfanCodesBTW/PromptForge-AI/compare/promptforge-ai-v1.1.0...promptforge-ai-v1.2.0) (2026-07-06)


### Features

* dynamic model selection, interactive hotkey recording, clean responses, and provider fixes ([3c220c6](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/3c220c64a42b54c1c61ed46c3786aed77c2dde97))
* trigger initial automated release ([616802e](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/616802e5e8b684b1c55c7726045fab949ba744d8))


### Bug Fixes

* remove strict knip dependency checks from CI pipeline ([6083581](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/6083581e773d7c3b8ac63ee877968e861bd15ada))
* resolve CI failures and release workflow issues ([ca09c1a](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/ca09c1a35a1931b7013242f1f25f0e4d15077803))

## [1.1.0](https://github.com/IrfanCodesBTW/PromptForge-AI/compare/promptforge-ai-v1.0.0...promptforge-ai-v1.1.0) (2026-07-06)


### Features

* dynamic model selection, interactive hotkey recording, clean responses, and provider fixes ([3c220c6](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/3c220c64a42b54c1c61ed46c3786aed77c2dde97))
* trigger initial automated release ([616802e](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/616802e5e8b684b1c55c7726045fab949ba744d8))


### Bug Fixes

* remove strict knip dependency checks from CI pipeline ([6083581](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/6083581e773d7c3b8ac63ee877968e861bd15ada))
* resolve CI failures and release workflow issues ([ca09c1a](https://github.com/IrfanCodesBTW/PromptForge-AI/commit/ca09c1a35a1931b7013242f1f25f0e4d15077803))

## [Unreleased]

### Added
- Smart context detection for automatic prompt categorization
- Floating command palette (Ctrl+Shift+P)
- Gemini and Anthropic provider support
- Prompt quality scoring

---

## [0.1.0] - 2026-07-05

### Added
- Initial project setup and repository structure
- Complete documentation suite:
  - README.md — Project overview and quick start guide
  - ARCHITECTURE.md — System architecture and module design
  - TECH_STACK.md — Technology choices and rationale
  - FEATURES.md — Detailed feature specifications
  - DESIGN.md — UI/UX design system and system design
  - DATABASE_SCHEMA.md — SQLite schema and migration strategy
  - API.md — IPC and HTTP API reference
  - MCP.md — Model Context Protocol integration plan
  - ROADMAP.md — Development roadmap and milestones
  - CONTRIBUTING.md — Contribution guidelines
- Product Requirements Document (PRD.md)
- MIT License
- GitHub issue and PR templates

---

[Unreleased]: https://github.com/your-username/PromptForgeAI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-username/PromptForgeAI/releases/tag/v0.1.0
