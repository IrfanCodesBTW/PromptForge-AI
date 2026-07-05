# PromptForge AI — MVP Implementation Plan

> **Goal:** Ship a working, demo-ready v1.0 MVP: select text anywhere → hotkey → enhanced prompt back on the clipboard, powered by local (Ollama) or cloud (Groq) AI, with history and settings.
> **Principle:** Speed and demo-readiness over perfection. Cut anything not on the critical path to the core loop.
> **Stack (locked):** Electron 30+ · React 18 · TypeScript 5.4 · Vite · TailwindCSS · Zustand · better-sqlite3 · Fastify · pnpm.

---

## 1. Foundation Setup

### 1.1 Repo Structure (target)

- `src/main/` — Electron main process: `hotkeys/`, `clipboard/`, `tray/`, `ipc/`, `windows/`, `index.ts`.
- `src/renderer/` — React UI: `components/`, `pages/` (Settings, History, Templates), `hooks/`, `stores/`, `App.tsx`.
- `src/services/` — Business logic: `ai/` (provider adapters + router), `prompt/` (engine, enhancer), `template/`, `db/`.
- `src/server/` — Fastify local API (stub for MVP, full in v2).
- `src/shared/` — `types.ts`, `constants.ts`, `utils.ts`.
- `templates/` — Built-in prompt templates (JSON).
- `migrations/` — SQLite schema migrations (`001_initial.sql`).
- `tests/` — `unit/`, `integration/`, `e2e/`.

### 1.2 Dependencies

- **Core:** `electron`, `electron-vite`, `electron-builder`, `react`, `react-dom`, `typescript`, `vite`.
- **UI/State:** `tailwindcss`, `postcss`, `autoprefixer`, `zustand`, `framer-motion`.
- **Data:** `better-sqlite3`.
- **AI SDKs:** `ollama`, `groq-sdk`, `openai` (OpenAI + OpenRouter compatible).
- **Server (light):** `fastify`.
- **Dev:** `vitest`, `@testing-library/react`, `playwright`, `eslint`, `prettier`, `husky`, `lint-staged`.
- **Version policy:** exact pins for runtime deps, caret for dev deps; commit `pnpm-lock.yaml`.

### 1.3 Environment Setup

- Prereqs: Node.js 20+, pnpm 8+, Git; Ollama optional for offline demo (`ollama pull llama3.1`).
- `pnpm install` → `pnpm dev` (electron-vite HMR) → `pnpm build` → `pnpm package`.
- `.env` / `config.json` in `{userData}` for provider keys and settings (never committed).
- Rebuild native module: ensure `better-sqlite3` compiles for the Electron ABI (`electron-rebuild` if needed).

### 1.4 Scaffolding Tasks

- [ ] Init `electron-vite` project (main + preload + renderer entries).
- [ ] Configure `tsconfig` (strict), path aliases (`@main`, `@renderer`, `@services`, `@shared`).
- [ ] Wire TailwindCSS + base theme tokens (dark/light) from DESIGN.md.
- [ ] Set up ESLint + Prettier + Husky pre-commit (`lint-staged`).
- [ ] Create `src/shared/types.ts` (EnhanceMode, Provider, HistoryEntry, Template, AppSettings).
- [ ] Establish IPC channel contract (`promptforge:*`) in `channels.ts` + `contextBridge` preload.
- [ ] Base UI shell: window frame, tray icon, notification/toast component.

---

## 2. Core MVP Features

> All P0 features from FEATURES.md. Order reflects the critical demo path.

### 2.1 Global Hotkeys + Clipboard Loop (P0 — the spine)

- Register system-wide shortcuts via Electron `globalShortcut` (`manager.ts`, `defaults.ts`).
- Default demo bindings: `Ctrl+Shift+E` Enhance · `Ctrl+Shift+X` Expand · `Ctrl+Shift+K` Compress · `Ctrl+Shift+P` Palette.
- Capture selection: save current clipboard → simulate copy → read selected text → restore after.
- Return result: write enhanced text to clipboard; optional auto-paste (simulate paste keystroke).
- Guard rails: if no text captured, toast "No text selected"; handle registration conflicts gracefully.
- **Steps:** implement clipboard `reader.ts`/`writer.ts` → hotkey manager → toast feedback → tray quick-actions.

### 2.2 AI Provider Layer (P0)

- Define `AIProvider` interface: `enhance(input, systemPrompt, opts) → { text, tokens, latency }` (+ streaming).
- Adapters: **Ollama** (offline default), **Groq** (fast cloud demo), **OpenAI** (fallback/compat).
- `router.ts`: pick default provider; on failure (timeout/429/5xx) fall back to next in chain.
- API keys stored encrypted at rest (Electron `safeStorage`); never logged or transmitted elsewhere.
- Health check: ping endpoint + validate key in Settings.
- **Steps:** interface → Ollama adapter → Groq adapter → OpenAI adapter → router + fallback → health check.

### 2.3 Prompt Engine + Templates (P0)

- `engine.ts` orchestrates: input → select template → interpolate variables → provider call → format output.
- **9 enhancement modes:** Enhance, Expand, Compress, Explain, Translate, Grammar Fix, Convert to PRD, Convert to Markdown, Notes to Prompt.
- Built-in templates (system_prompt + user_prompt_template + variables); ship 5 core for MVP (Coding, Writing, Research, Marketing, General), stub the rest.
- Template schema: `{ name, description, category, system_prompt, user_prompt_template, variables }`.
- **Steps:** mode→template map → variable interpolation → engine orchestration → output formatter → clipboard handoff.

### 2.4 Database + Prompt History (P0)

- SQLite at `{userData}/promptforge.db`, WAL mode, migration runner (`schema_version` table).
- **Tables:** `prompt_history`, `templates`, `providers`, `settings`, `hotkeys`, `tags`, `prompt_tags` + `prompt_history_fts` (FTS5).
- Auto-log every enhancement: original, enhanced, provider, model, template, category, token_count, latency_ms, timestamp.
- History UI: list + full-text search + filter (provider/date) + favorite + copy-to-clipboard.
- **Steps:** `database.ts` connection → migration `001_initial.sql` → `history.ts` CRUD → FTS search → History page.

### 2.5 Settings & Preferences (P0)

- Settings page: theme, provider + API key, default model, temperature (0.7), max tokens (2048), hotkey bindings, auto-paste, notifications.
- Persist to local JSON config; changes apply live (except system-startup toggle).
- Zustand `appStore` mirrors settings for the renderer; IPC syncs to main process.
- **Steps:** settings schema + defaults → JSON persistence → Settings UI → live-apply + reset-to-defaults.

### 2.6 UI Flows (demo surface)

- **Core loop (headless):** hotkey → toast "Enhancing…" → toast "Done · {mode} · {tokens} tokens".
- **First-run onboarding:** pick provider, enter key (or detect Ollama), confirm hotkeys.
- **Tray menu:** enhance modes, open Settings, open History, quit.
- **History browser + Settings panel** as full windows.

---

## 3. Execution Roadmap

| Phase | Scope | Key Deliverables | Depends On | Est. Effort |
|-------|-------|------------------|------------|-------------|
| **P0 — Setup** | Scaffold, tooling, IPC contract, DB init | Running Electron shell + HMR, tray, empty windows | — | 1–2 days |
| **P1 — Core Loop** | Hotkeys + clipboard + Ollama adapter + Enhance mode | End-to-end: select → hotkey → enhanced text on clipboard | Setup | 2–3 days |
| **P2 — Providers & Modes** | Groq + OpenAI adapters, router/fallback, all 9 modes, templates | Multi-provider enhancement across all modes | Core Loop | 2–3 days |
| **P3 — Persistence** | SQLite migrations, history logging, FTS search, History UI | Searchable history, favorites | Core Loop | 1–2 days |
| **P4 — Settings & Polish** | Settings UI, onboarding, theming, error/toast states | Configurable app, dark/light, friendly errors | P2, P3 | 1–2 days |
| **P5 — Test & Package** | Tests + electron-builder installers | Signed-ish builds (NSIS/DMG/AppImage), green test suite | All | 1–2 days |

- **Critical path:** Setup → Core Loop → Providers/Modes → Test/Package. History and Settings can proceed in parallel once the core loop lands.
- **Demo cutline:** if time-constrained, ship Enhance/Expand/Compress + Ollama + Groq + history logging + basic Settings. Defer Explain/Translate/PRD/Markdown/Notes and command palette to v1.5.

---

## 4. Testing & Validation

### 4.1 Unit (Vitest)

- Template variable interpolation (correct substitution, missing-var handling).
- Provider router fallback logic (primary fails → secondary used).
- Context/mode → template mapping.
- DB CRUD + migration idempotency.
- Clipboard save/restore utility.

### 4.2 Integration

- Engine end-to-end with a **mocked provider** (input → formatted output + history row written).
- Provider health-check against a stubbed endpoint.
- Settings persistence round-trip (write → restart → read).
- FTS search returns expected history entries.

### 4.3 End-to-End (Playwright + Electron)

- App launches, tray present, windows open.
- Trigger Enhance via IPC/action → clipboard contains transformed text → toast shown.
- History page lists the new entry and search finds it.
- Settings change (provider/model) reflected in next enhancement.

### 4.4 MVP Completion Criteria

- [ ] Core loop works from ≥3 real apps (e.g., VS Code, Chrome, Notepad).
- [ ] Enhance/Expand/Compress functional on Ollama **and** Groq.
- [ ] Enhancement latency: < 2s (Groq), < 5s (Ollama 7B).
- [ ] Every enhancement logged and searchable in history.
- [ ] Settings persist across restart; API keys stored encrypted.
- [ ] Graceful errors for empty input, provider failure, missing key.
- [ ] Idle memory < 150 MB; cold start < 3s.
- [ ] Unit + integration suites green; core E2E passes.

---

## 5. Deployment & Documentation

### 5.1 Local (Dev)

```bash
pnpm install
ollama pull llama3.1     # optional, for offline demo
pnpm dev                 # electron-vite with HMR
```

### 5.2 Production Build & Package

```bash
pnpm build               # compile main + preload + renderer
pnpm package             # electron-builder installers
```

- Targets: Windows **NSIS**, macOS **DMG**, Linux **AppImage** (via `electron-builder.yml`).
- Auto-update via `electron-updater` + GitHub Releases (config now, enable post-MVP).
- Code signing required for macOS/Windows distribution (defer for internal demo builds).

### 5.3 Cloud / Distribution

- Publish installers to **GitHub Releases** (draft release from CI on tag `v0.1.0`).
- CI (GitHub Actions): lint → test → build matrix (win/mac/linux) → upload artifacts.
- No server infra required — app is local-first; Fastify API is localhost-only.

### 5.4 Demo Script (≈3 min)

1. **Hook (15s):** "Prompt engineering breaks your flow — write, switch to a chat, ask for improvements, copy, paste back. PromptForge kills those 5 steps."
2. **Offline enhance (40s):** In VS Code, select a rough prompt → `Ctrl+Shift+E` → toast → paste the polished result. Note: "That ran fully local via Ollama — nothing left my machine."
3. **Speed with Groq (30s):** Switch provider in Settings → enhance again → highlight sub-2-second latency.
4. **Modes (30s):** Select verbose text → Compress; select notes → Notes-to-Prompt. Same hotkey muscle memory, different outcomes.
5. **History (25s):** Open History → search a past prompt → show before/after + provider/model/tokens metadata → favorite it.
6. **Privacy close (20s):** "Local-first, encrypted keys, no telemetry. Your prompts, your models, your machine."

### 5.5 Storytelling Notes

- **Problem → relief:** anchor on the interrupted 5-step workflow; every demo beat removes friction.
- **Show, don't tell:** trigger from a real third-party app to prove "works everywhere."
- **Differentiators to stress:** universal hotkey layer · local-first privacy · provider choice + fallback.
- **Have a fallback:** pre-pull the Ollama model and pre-enter a Groq key before the demo; keep a canned prompt ready in case of live network issues.

---

*This plan is derived from PRD.md, TECH_STACK.md, FEATURES.md, ARCHITECTURE.md, DATABASE_SCHEMA.md, and ROADMAP.md. It targets v1.0 (P0) scope only; v1.5/v2.0 features (context detection, command palette, MCP, browser extension) are intentionally out of MVP scope.*
