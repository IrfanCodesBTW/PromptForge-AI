<div align="center">

# 🗺️ PromptForge AI — Roadmap

**Where we are, where we're going, and how you can help shape the future.**

</div>

---

## 📍 Current Status

> **Current Version: 1.5.0**
> **Phase: Intelligence Features Complete**

```
Progress: ████████████████████ 100%
```

| Milestone | Status | Target |
|-----------|--------|--------|
| v1.0 — Foundation (MVP) | 🟢 Completed | Q3 2026 |
| v1.5 — Intelligence | 🟢 Completed | Q3 2026 |
| v2.0 — Ecosystem | 🔴 Planned | Q3 2027 |

---

## 🏗️ Version Milestones

### v1.0 — Foundation (MVP)

**Target:** Core prompt enhancement with hotkeys and local AI
**Status:** 🟡 In Development
**ETA:** Q3 2026

```
Progress: ██░░░░░░░░░░░░░░░░░░ 10%
```

#### Core Engine

- [ ] Prompt enhancement engine — Enhance, Expand, and Compress modes
- [ ] Enhancement pipeline with pre/post processing hooks
- [ ] Prompt validation and sanitization layer

#### System Integration

- [ ] Global hotkey system (system-wide shortcuts via Electron `globalShortcut`)
- [ ] Clipboard management (read selection, write result, auto-paste)
- [ ] System tray integration (background running, quick access menu)
- [ ] Cross-platform window detection (identify active application)

#### AI Providers

- [ ] Ollama integration (local AI, fully offline-capable)
- [ ] Groq integration (fast cloud inference, sub-second responses)
- [ ] OpenAI integration (GPT-4o, GPT-4o-mini)
- [ ] Basic error handling and automatic provider fallback

#### Data & Storage

- [ ] SQLite database with migration system
- [ ] Prompt history (full before/after storage, searchable)
- [ ] 5 built-in templates: Coding, Writing, Research, Marketing, General
- [ ] User preferences persistence

#### User Interface

- [ ] Settings panel (provider configuration, API key management)
- [ ] Hotkey customization UI
- [ ] Minimal enhancement notification (success/failure feedback)
- [ ] First-run onboarding wizard

#### Distribution

- [ ] Windows installer (NSIS)
- [ ] macOS installer (DMG)
- [ ] Linux package (AppImage)
- [ ] Auto-signed builds with CI/CD pipeline

#### ✅ Success Criteria

| Metric | Target |
|--------|--------|
| Enhancement latency (Groq) | < 2 seconds |
| Enhancement latency (Ollama 7B) | < 5 seconds |
| Application compatibility | 10+ apps tested |
| Memory usage (idle) | < 150 MB |
| Cold start time | < 3 seconds |
| Crash-free sessions | > 99% |

---

### v1.5 — Intelligence

**Target:** Real-Time Streaming Preview, Persona Identities, FTS4 Search & Multi-Turn Refinement
**Status:** 🟢 Completed
**ETA:** Q3 2026

```
Progress: ████████████████████ 100%
```

#### Core Intelligence Features

- [x] Streaming Infrastructure (`completeStream()` optional interface method, Ollama/Groq/OpenAI async generators)
- [x] Floating Preview Window (always-on-top frameless overlay, live streaming tokens, Accept/Reject/Re-run controls)
- [x] Persona Profiles (custom tone, format rules, system prompt injections, default tray menu selector)
- [x] Smart History Stack + FTS4 Full-Text Search (SQLite FTS4 inverted index search, `Ctrl+Shift+H` quick picker popup, side-by-side word diffs)
- [x] Multi-Turn Refinement Loop (in-memory sessions with 5-min auto-expiry, embedded preview chat bar, sub-800 token prompt budgeting)
  - ✅ Coding, Writing, Research, Marketing, General *(from v1.0)*
  - 🆕 UI/UX, PRD, SEO, Startup Pitch, Business, Automation
- [ ] Template import/export (JSON format)
- [ ] Community template sharing via GitHub Gists

#### Additional Providers

- [ ] Gemini integration (Google AI)
- [ ] Anthropic integration (Claude)
- [ ] OpenRouter integration (unified access to 100+ models)

#### UX Improvements

- [ ] Prompt diff view (side-by-side before/after comparison)
- [ ] Usage analytics dashboard (local only, never phoned home)
- [ ] Enhancement streaks and productivity insights
- [ ] Auto-update system (silent background updates)

#### ✅ Success Criteria

| Metric | Target |
|--------|--------|
| Context detection accuracy | > 80% |
| Command palette response | < 100 ms |
| Zero-mouse workflow | All core actions accessible |
| Template coverage | 11 categories |
| User satisfaction (beta) | > 4.5/5 |

---

### v2.0 — Ecosystem

**Target:** Platform extensibility and advanced features
**Status:** 🔴 Planned
**ETA:** Q3 2027

```
Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
```

#### Platform Integration

- [ ] MCP server (expose PromptForge as a tool for Claude, Cursor, VS Code, etc.)
- [ ] Browser extension (Chrome + Firefox — enhance prompts directly in web UIs)
- [ ] Fastify HTTP API (local REST API for third-party integrations)

#### Advanced Input

- [ ] OCR capture (screenshot a region → extract text → enhance prompt)
- [ ] Voice-to-prompt (speech recognition → text → enhancement)
- [ ] Multi-modal input (images as context for prompt generation)

#### Extensibility

- [ ] Plugin SDK (custom providers, actions, UI extensions)
- [ ] Plugin marketplace (local registry with verified plugins)
- [ ] Custom enhancement strategies (user-defined prompt engineering rules)
- [ ] Webhook support (trigger enhancements from external tools)

#### Collaboration

- [ ] Team sharing (encrypted sync between devices)
- [ ] Shared template libraries (team-managed templates)
- [ ] Prompt chains (multi-step enhancement pipelines)

#### Advanced AI

- [ ] Custom AI model fine-tuning integration (train on your prompt style)
- [ ] A/B testing for enhancements (compare two provider outputs)
- [ ] API rate limiting dashboard with cost tracking

#### Polish

- [ ] Multi-language UI (i18n with 10+ languages)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Theming engine (custom colors, fonts, layouts)
- [ ] Performance profiling and optimization pass

#### ✅ Success Criteria

| Metric | Target |
|--------|--------|
| MCP conformance | Pass all protocol tests |
| Plugin SDK adoption | 3+ community plugins |
| Browser extension | Chrome + Firefox stores |
| API response time | < 50 ms (local endpoints) |
| Accessibility | WCAG AA certified |

---

## 📊 Feature Priority Matrix

Features ranked by priority to guide development focus:

| # | Feature | Priority | Effort | Impact | Version |
|---|---------|----------|--------|--------|---------|
| 1 | Core enhancement engine (Enhance/Expand/Compress) | 🔴 Critical | Medium | Very High | v1.0 |
| 2 | Global hotkey system | 🔴 Critical | Low | Very High | v1.0 |
| 3 | Ollama integration (local/offline) | 🔴 Critical | Medium | High | v1.0 |
| 4 | Clipboard management & auto-paste | 🔴 Critical | Medium | Very High | v1.0 |
| 5 | Groq integration (fast cloud) | 🟠 High | Low | High | v1.0 |
| 6 | Prompt history (SQLite) | 🟠 High | Medium | High | v1.0 |
| 7 | Settings UI | 🟠 High | Medium | Medium | v1.0 |
| 8 | System tray integration | 🟠 High | Low | Medium | v1.0 |
| 9 | OpenAI integration | 🟡 Medium | Low | Medium | v1.0 |
| 10 | Built-in templates (5 core) | 🟡 Medium | Low | Medium | v1.0 |
| 11 | Floating command palette | 🟠 High | High | Very High | v1.5 |
| 12 | Smart context detection | 🟠 High | High | High | v1.5 |
| 13 | Prompt quality scoring | 🟡 Medium | Medium | Medium | v1.5 |
| 14 | Gemini/Anthropic/OpenRouter providers | 🟡 Medium | Low | Medium | v1.5 |
| 15 | Auto-update system | 🟡 Medium | Medium | Medium | v1.5 |
| 16 | MCP server | 🟠 High | High | Very High | v2.0 |
| 17 | Browser extension | 🟡 Medium | High | High | v2.0 |
| 18 | Plugin SDK | 🟡 Medium | Very High | High | v2.0 |
| 19 | OCR capture | 🟢 Low | High | Medium | v2.0 |
| 20 | Voice-to-prompt | 🟢 Low | High | Low | v2.0 |

**Priority Legend:**
- 🔴 Critical — Must have for release
- 🟠 High — Strong user value, ship if possible
- 🟡 Medium — Important but can wait
- 🟢 Low — Nice to have, future consideration

---

## 💡 Community Requests

> 📣 **Have a feature request?** [Open an issue](https://github.com/your-username/PromptForgeAI/issues/new?labels=enhancement&template=feature_request.md) with the `enhancement` label.

We track community-requested features here as they gain traction:

| Request | Votes | Status | Notes |
|---------|-------|--------|-------|
| *No requests yet* | — | — | Be the first! |

Popular requests with significant community support will be prioritized in upcoming milestones.

---

## 🤝 Contributing to the Roadmap

We believe the best products are shaped by their users. Here's how you can influence where PromptForge AI goes next:

### 💬 Share Your Ideas

- **Feature Requests** — [Open an issue](https://github.com/your-username/PromptForgeAI/issues/new?labels=enhancement) describing your use case and the problem you want solved
- **Discussions** — Join [GitHub Discussions](https://github.com/your-username/PromptForgeAI/discussions) to brainstorm with the community
- **Upvote** — React with 👍 on existing issues to signal priority

### 🛠️ Contribute Directly

- **Pick up an issue** — Look for issues tagged `good-first-issue` or `help-wanted`
- **Submit a PR** — See our [Contributing Guide](./CONTRIBUTING.md) for development setup
- **Write a plugin** — When v2.0 Plugin SDK ships, build and share your own extensions

### 📋 How We Prioritize

1. **User impact** — How many people does this help? How much friction does it remove?
2. **Alignment** — Does it support our local-first, privacy-respecting mission?
3. **Feasibility** — Can we ship it reliably within the target milestone?
4. **Community signal** — Issue upvotes, discussion engagement, and PR contributions

---

## 📅 Release Cadence

| Type | Frequency | Description |
|------|-----------|-------------|
| Patch (x.x.1) | As needed | Bug fixes, security patches |
| Minor (x.1.0) | Monthly | New features, improvements |
| Major (1.0, 2.0) | Milestone-based | Significant capability additions |

---

## 🔮 Long-Term Vision

PromptForge AI aims to become the **universal prompt layer** — an invisible, intelligent assistant that makes every AI interaction better, regardless of which app or model you're using. Our north star:

- **Zero friction** — Enhancement happens so fast it feels instant
- **Zero lock-in** — Your data is yours, your prompts are yours, your choice of AI is yours
- **Zero compromise** — Local-first privacy with cloud-grade intelligence when you want it

---

<div align="center">

**This roadmap is a living document.** Last updated: July 2026.

[⭐ Star the repo](https://github.com/your-username/PromptForgeAI) to stay updated on our progress.

</div>
