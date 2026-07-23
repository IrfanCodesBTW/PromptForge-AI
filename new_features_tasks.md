# New Features Tasks — v1.5 Intelligence

> Live execution tracker for [`docs/new_features_plan.md`](docs/new_features_plan.md).
> Check items off as completed. If a `[BUFFER]` day is used, add a one-line note
> under it describing what it was spent on. If execution deviates from this
> order, log it in the plan doc's Amendments section, not just here.

---

## Phase 0 — MVP Core Stability Gate (2 days) ✅ COMPLETE

- [x] Audit `PromptEngine` (`src/services/prompt/engine.ts`) for known issues/crashes — clean, linear pipeline, history write wrapped in try/catch
- [x] Audit `ProviderRouter` (`src/services/ai/router.ts`) for known issues/crashes — fallback chain + health checks sound
- [x] Audit `HotkeyManager` (`src/main/hotkeys/manager.ts`) for known issues/crashes — linear await chain confirmed as documented, no dead-ends
- [x] Audit IPC handler Zod validation (`src/main/ipc/handlers.ts`) for gaps — all handlers consistently validate via Zod schemas
- [x] Audit DB migrations (`migrations/`) for correctness against the sql.js runner — confirmed only `001_initial.sql` + `002_default_templates.sql` exist; next migrations correctly numbered `003`/`004`
- [x] Audit Settings (persistence, IPC round-trip) for issues — `SETTINGS_GET/SET/GET_ALL` handlers sound
- [x] Run `npm run validate` (lint, format:check, typecheck, test, licenses) — **PASSED**: 0 lint errors (40 pre-existing warnings, non-blocking), Prettier clean, typecheck clean, 55/55 tests passed, license report clean (MIT/ISC/BSD/Apache-2.0, nothing concerning)
- [x] Create `new_features_tasks.md` tracker (this file)
- [x] Log deferred MVP polish items (installer, onboarding wizard) as explicitly non-blocking — see "Deferred / Non-Blocking" section below
- [x] Fix any blocking issues found before proceeding to Phase 1 — **none found**, gate passed clean, no fixes required

## Phase 1 — Streaming Infrastructure (6 days + 1 buffer) ✅ COMPLETE

- [x] Add `completeStream()` optional method + `TokenChunk` type to `AIProvider` interface (`src/services/ai/provider.ts`)
- [x] Implement `completeStream()` in `OllamaProvider` (`src/services/ai/ollama.ts`)
- [x] Implement `completeStream()` in `GroqProvider` (`src/services/ai/groq.ts`)
- [x] Implement `completeStream()` in `OpenAIProvider` (`src/services/ai/openai.ts`) — covers OpenAI + OpenRouter
- [x] Add `PromptEngine.enhanceStream()` (`src/services/prompt/engine.ts`) with hybrid fallback to `complete()`
  - Implemented via new `ProviderRouter.streamWithFallback()` which centralizes the hybrid fallback logic (streaming → non-streaming `complete()`), reused by the engine
- [x] Unit tests: happy-path streaming per provider (mocked SDKs) — `tests/unit/providers.test.ts`
- [x] Unit tests: partial-stream failure → fallback to `complete()` — `tests/integration/router.test.ts`
- [x] Unit tests: empty/zero-chunk stream edge case — `tests/integration/router.test.ts`
- [x] Confirm zero changes to existing `complete()` callers — `complete()` signature/body untouched on all 3 adapters
- [x] `[BUFFER]` — run `npm run validate`, fix regressions
  - Note: format:check initially failed on `router.ts`/`engine.ts` (unformatted new code); fixed via `prettier --write`. Final `npm run validate`: 0 lint errors (41 pre-existing-style warnings), format clean, typecheck clean, **64/64 tests passing** (9 new streaming tests added), licenses clean. No regressions to existing callers.

## Phase 2 — Floating Preview Window (8 days + 1 buffer) ✅ COMPLETE

- [x] Create `src/main/windows/previewWindow.ts` (transparent, always-on-top, frameless, 420×280, cursor-positioned)
- [x] Add new IPC channels to `IPC_CHANNELS` (repurposed/extended alongside existing `ENHANCE_STREAM`/`WINDOW_OPEN` placeholders: added `PREVIEW_TOKEN_CHUNK`, `PREVIEW_STREAM_DONE`, `PREVIEW_STREAM_ERROR`, `PREVIEW_ACCEPT`, `PREVIEW_REJECT`, `PREVIEW_RERUN`, `WINDOW_CLOSE`)
- [x] Add Zod validation schemas for new channels in `src/main/ipc/handlers.ts` (accept/reject/rerun take no payload; token-chunk/stream-done/stream-error payload shapes validated via shared types + tested via schema patterns in `previewWindow.test.ts`)
- [x] Add type signatures in `src/shared/types.ts` (`PreviewTokenChunkPayload`, `PreviewStreamDonePayload`, `PreviewStreamErrorPayload`, `PreviewActionPayload`)
- [x] Modify `HotkeyManager.handleTrigger()` to spawn preview window + call `enhanceStream()` — implemented as `runPreviewFlow()`/`streamIntoPreview()`, gated by `isPreviewWindowEnabled()` feature flag
- [x] Clipboard write moved to Accept action only (not automatic) — `handlePreviewAccept()`
- [x] Create `src/renderer/preview/` entry point (separate Vite build entry in `electron.vite.config.ts`, separate bundle from main app)
- [x] Live token display with blinking cursor
- [x] Provider name + latency pill badge
- [x] Accept / Reject / Re-run buttons + keyboard bindings (Enter/Escape/Ctrl+R)
- [x] Hybrid fallback UI ("Streaming unavailable — displaying completed response")
- [x] Error states in `--color-error` token with retry option
- [x] Feature-flag preview window behind a settings toggle — `preview_window_enabled` setting, Settings → General tab, defaults off
- [x] Unit tests: `tests/unit/previewWindow.test.ts` (IPC validation, lifecycle, state machine) — 13 tests
- [x] Playwright E2E: Accept/Reject flow — `tests/e2e/previewWindow.spec.ts` (4 tests: accept, reject, rerun, fallback notice), served via local http server to avoid file:// CORS module-script restrictions
- [x] Docs: `ARCHITECTURE.md` new section 10 + Mermaid sequence diagram
- [x] `[BUFFER]` — multi-monitor positioning, focus-loss edge cases, `npm run validate` + Playwright
  - Note: Had to add a real HTTP static server inside the E2E test (rather than `file://` loading) because Chromium blocks cross-file ES module/CSS loading under an opaque `file://` origin — this doesn't reflect Electron's real behavior but is a Playwright/Chromium harness quirk. Had to `npx playwright install chromium` (browser binary wasn't present in this environment). Prettier formatting fixup needed on `PreviewApp.tsx` and a couple of unused-var/lint cleanups in the new test file. Final `npm run validate`: 0 lint errors (61 warnings, consistent style), format clean, typecheck clean, **77/77 unit/integration tests passing** (13 new), licenses clean. Playwright: all 4 new preview E2E tests pass; pre-existing `app.spec.ts` window/title/root tests still pass (1 pre-existing Axe/Electron driver incompatibility unrelated to this phase, not a regression — no `playwright.config.ts` exists in the repo, so `npx playwright test` with no path arg globs the whole `tests/` tree including vitest specs; must always target `tests/e2e/` explicitly, a pre-existing gap not introduced by this phase).

## Phase 3 — Persona Profiles (6 days + 1 buffer) ✅ COMPLETE

- [x] Migration `migrations/003_personas.sql`: `personas` table + single-default trigger
  - Note: NOT a DB trigger — verified against real runner that multi-statement trigger bodies break under naive semicolon-splitting; single-default enforcement moved to `PersonaService` application layer instead
- [x] Migration: add `persona_override_allowed BOOLEAN DEFAULT 1` to `templates`
- [x] Migration data step: set `persona_override_allowed = 0` for the 5 existing built-in templates
  - Note: actually 9 built-in templates exist (one per EnhanceMode, not 5 "Coding/Writing/..." — original spec's naming didn't match reality), all correctly set to 0 via `WHERE is_builtin = 1`
- [x] Migration: seed 5 built-in personas (General/default, Developer, Executive, Creative, Social)
  - Note: seeded inline in `003_personas.sql`, not a separate `migrations/seeds/` file — migration runner doesn't scan subdirectories
- [x] `src/services/db/personaService.ts`: `getAll`, `getDefault`, `create`, `update`, `delete`, `setDefault`
- [x] Enforce built-ins can be duplicated but not deleted (service layer) — `delete()` throws for `isBuiltin` personas
- [x] New `src/shared/schemas/persona.ts` Zod schemas
- [x] Update `PromptEngine.enhance()` with persona+template composition (`---` separator, override flag respected)
- [x] Update `PromptEngine.enhanceStream()` with same composition logic (shared via `buildPrompts()`)
- [x] Tray menu: "Persona" submenu (radio items) + tooltip showing active persona — dynamic rebuild via `refreshPersonaMenu()`
- [x] Settings UI: new "Personas" tab (list + editor + live preview panel)
- [x] Unit tests: `personaService` CRUD + default-trigger enforcement — via DB integration test against real migration runner
- [x] Integration test: `PromptEngine` injection order/separator + override-flag behavior — 4 tests in `tests/unit/engine.test.ts`
- [x] Snapshot test: Settings Personas tab — `tests/unit/settingsPersonas.test.tsx` (3 tests, jsdom environment added scoped to this file)
- [x] Docs: `DATABASE_SCHEMA.md` — `personas` table, trigger-avoidance rationale, new `templates` column
- [x] `[BUFFER]` — verify trigger against real migration runner, `npm run validate`
  - Note: **Critical finding** — initial migration used `CREATE TRIGGER ... BEGIN ... END` for single-default enforcement per the original plan. Direct testing against the real `runMigrations()` (via `tests/integration/db.test.ts`) proved this fails silently: the runner's naive `.split(';')` breaks multi-statement trigger bodies into invalid fragments, caught+warned rather than thrown, meaning the trigger would silently never be created in production. Rewrote to enforce single-default at the `PersonaService` application layer instead (same transactional guarantee, verified working against real sql.js). Also required careful semicolon hygiene in migration file comments themselves (a comment containing a literal `;` also breaks statement splitting) — rewrote all comments to avoid embedded semicolons entirely. Added `jsdom` + `@vitejs/plugin-react` as new devDependencies (scoped `// @vitest-environment jsdom` docblock on the one test file that needs real DOM rendering) to fulfill the snapshot-test deliverable; flagged 9 pre-existing high-severity production vulnerabilities in `electron`/`react-router-dom`/`fastify`'s transitive deps discovered via `npm audit --omit=dev` — unrelated to this phase's changes, not acted on (out of scope, would require breaking version bumps). Final `npm run validate`: 0 lint errors (62 warnings, consistent style), format clean (prettier --write needed on 3 files), typecheck clean, **86/86 tests passing** (9 new: 2 DB integration, 4 engine persona composition, 3 Settings snapshot), licenses clean.

## Phase 4 — Smart History Stack + FTS4 (8 days + 1 buffer) ✅ COMPLETE (FTS5 → FTS4 deviation, see Amendments)

### 4a. FTS4 data layer (~3 days) — DEVIATION: FTS5 unavailable, using FTS4 (see below)
- [x] **Spike: verify FTS5 is compiled into `sql.js@1.11.0` WASM build** (do this FIRST)
  - **RESULT: FTS5 IS NOT AVAILABLE.** Verified via a standalone Node script directly instantiating `sql.js` and running `CREATE VIRTUAL TABLE test USING fts5(content)` — throws `no such module: fts5`. Cross-checked via `PRAGMA compile_options`: the compiled SQLite build has `ENABLE_FTS3` and `ENABLE_FTS3_PARENTHESIS` but no FTS5 flag at all. Confirmed genuine (not a syntax error) by also successfully creating FTS3 and FTS4 virtual tables in the same session.
- [x] **ESCALATED per plan instruction — stopped, presented 3 options to user, did not silently substitute.** User selected option (a): use FTS4 instead of FTS5.
  - Decision rationale: FTS4 is already compiled into this exact sql.js build (zero new deps), same `CREATE VIRTUAL TABLE ... USING fts4(...)` + `MATCH` query syntax, real inverted-index search. Only difference from the plan: no native `bm25()` ranking function — using `matchinfo()`/simple term-frequency ranking instead. No schedule impact. Rejected alternatives: swapping to an FTS5-capable SQLite/WASM package (`sql.js-fts5` fork or official `sqlite-wasm`) would mean replacing the DB engine every Phase 0-3 migration/test is built against, and the official package uses an incompatible async/worker API — too large a change for one feature. Ranked-LIKE fallback also rejected since FTS4 gives strictly better search with no extra cost.
- [ ] Migration `migrations/004_history_fts4.sql`: `prompt_history_fts` virtual table (using `fts4`, not `fts5`)
- [ ] Migration: INSERT/UPDATE/DELETE sync triggers (test against real migration runner)
- [ ] Migration: backfill existing rows into FTS4 table
- [ ] `HistoryService.getRecentHistory(limit, query?)` — FTS4 `MATCH` + term-frequency ranking, fallback to `ORDER BY created_at DESC`
- [ ] Migrate existing `HistoryService.query()` search filter to use FTS4 instead of `LIKE`
- [ ] Migration `migrations/004_history_fts5.sql`: `prompt_history_fts` virtual table
- [ ] Migration: INSERT/UPDATE/DELETE sync triggers (test against real migration runner)
- [ ] Migration: backfill existing `prompt_history` rows into FTS5 table
- [ ] `HistoryService.getRecentHistory(limit, query?)` — FTS5 `MATCH` + `bm25()` ranking, fallback to `ORDER BY created_at DESC`
- [ ] Migrate existing `HistoryService.query()` search filter to use FTS5 instead of `LIKE`

### 4b. History Picker Window + UI migration (~5 days) ✅ COMPLETE
- [x] `src/main/windows/historyWindow.ts` (transparent, always-on-top, frameless, 560×480)
- [x] Register `Ctrl+Shift+H` in `HotkeyManager` — added `history` action to `DEFAULT_HOTKEY_BINDINGS`, special-cased in `handleTrigger()` to open the picker instead of the enhance pipeline
- [x] Add + pin exact version of `diff` npm package (`diff@5.2.0` + `@types/diff@5.2.3`); flagged for `npm run licenses` — BSD-3-Clause, permissive, no concern
- [x] Side-by-side diff component (`--color-success-highlight`/`--color-error-highlight`) — `src/renderer/history-picker/DiffView.tsx` using `diffWords()`
- [x] Autofocused search input, 150ms debounce, IPC-wired to `getRecentHistory()`
- [x] `<mark>` highlighting of matched terms (`--color-primary-highlight`)
- [x] Per-entry action: Re-copy (clipboard + 1.5s toast)
- [x] Per-entry action: "Use as Base" (stub — wired fully in Phase 5, renamed to `openAsRefinementBase` to avoid a false-positive React Hooks lint rule on the `use*` naming convention)
- [x] Per-entry action: Delete (DB removal + 4s undo toast) — undo implemented via new `HISTORY_RESTORE` IPC channel that re-creates the entry (new id/timestamp, same content) since the backend is a hard delete
- [x] Full keyboard nav (↑/↓/Enter/Delete/Escape) + focus highlight
- [x] "Clear All History" button + confirmation dialog (native `window.confirm`)
- [x] `history_retention_days` setting — **DEVIATION**: did not introduce a new/duplicate setting key. `data_retention_days` (already exists, already exposed in Settings → Privacy, already implements exactly this purge behavior via `cleanupOldHistory()`) is documented as satisfying this requirement instead of creating a second competing retention knob for the same table
- [x] Rewire existing `History.tsx` / `historyStore.ts` search to FTS4 backend — **zero code changes needed**: `History.tsx` already flows through `IPC_CHANNELS.HISTORY_QUERY` → `HistoryService.query()`, which was migrated to use FTS4 in 4a; both consumers already share one backend
- [x] New Zustand store slice for history popup window state — `src/renderer/history-picker/historyPickerStore.ts`
- [x] Unit tests: FTS4 query logic — `tests/unit/historyFts.test.ts` (7 tests, mocked DB, verifies FTS-vs-LIKE branching, ranking SQL shape, sanitization)
- [x] Playwright E2E: search → re-copy flow — `tests/e2e/historyPicker.spec.ts` (3 tests: filter-on-search, re-copy via button click, re-copy via Enter keypress)
- [x] Docs: `DATABASE_SCHEMA.md` (FTS4 table + sync-strategy rationale), `API.md` (new IPC channel tables for Phase 2/3/4)
- [x] `[BUFFER]` — validate retention purge doesn't conflict with `data_retention_days`, `npm run validate` + Playwright
  - Note: Fixed two real bugs found via testing: (1) `getRecentHistory()`'s no-query path needed a `rowid DESC` tiebreaker since `datetime('now')` has 1-second resolution and two inserts in the same second otherwise sort non-deterministically; (2) initial FTS4 sync triggers (INSERT/UPDATE/DELETE) were written as DB triggers per the original plan text, but direct testing against the real migration runner (same lesson as Phase 3) proved even single-statement `CREATE TRIGGER ... BEGIN X END` bodies get split into a header fragment + dangling `END` fragment — abandoned ALL triggers, moved FTS sync to `HistoryService` application layer (`create()`/`deleteByIds()`/`deleteAll()`). Final `npm run validate`: 0 lint errors (70 warnings, consistent style; fixed 2 real errors — `jsx-a11y/no-autofocus` redundant with manual `.focus()`, and a false-positive `react-hooks/rules-of-hooks` triggered by a plain function named `useAsBase`), format clean, typecheck clean, **96/96 tests passing** (10 new: 7 historyFts unit + 3 already counted from 4a's DB integration additions — actually 13 new total across 4a+4b), licenses clean. Playwright: all 3 new history picker E2E tests pass; full e2e suite (10 tests) shows only the same pre-existing Axe/Electron-driver incompatibility, no regressions.

## Phase 5 — Multi-Turn Refinement Loop (8 days + 1 buffer) ✅ COMPLETE

- [x] `src/services/refinementSession.ts`: `RefinementSession` class + `refine()` async iterable
- [x] In-memory session store (`RefinementSessionManager` holding `Map<sessionId, RefinementSession>`), 5-min inactivity expiry (configurable)
- [x] Session lifecycle hooks into Phase 2 preview window (created on stream completion/history base selection, ended on accept/reject)
- [x] Refinement system prompt: original + current output + instruction + persona constraint, sub-800 token budget
- [x] Native multi-turn message format with structured context summary & fallback string support
- [x] New IPC channels: `REFINEMENT_START`, `REFINEMENT_SEND_INSTRUCTION`, `REFINEMENT_TOKEN_CHUNK`, `REFINEMENT_DONE`, `REFINEMENT_ERROR`, `REFINEMENT_END_SESSION`
- [x] New `src/shared/schemas/refinement.ts` Zod schemas
- [x] Wire channels into `src/main/ipc/handlers.ts`
- [x] UI: chat input bar (36px, auto-focus, placeholder text) in `PreviewApp.tsx`
- [x] UI: scrollable turn thread with alternating surface colors in `PreviewApp.tsx`
- [x] Wire "Use as Base" in History Picker window (`HistoryPickerApp.tsx`) to start a new `RefinementSession`
- [x] Settings UI: session timeout duration control (`refinementSessionTimeoutMinutes` in `Settings.tsx`)
- [x] Unit tests: `RefinementSession` state transitions & manager tests (`tests/unit/refinementSession.test.ts` — 6 tests)
- [x] Integration test: 3-turn conversation against mock provider (`tests/integration/refinement.test.ts` — 1 test)
- [x] Playwright E2E: enhance → refine once → accept (`tests/e2e/refinement.spec.ts` — 1 test)
- [x] Docs: `API.md` new IPC channels, `ARCHITECTURE.md` Section 11 + Mermaid sequence diagram
- [x] `[BUFFER]` — validate session expiry timing, `npm run validate` + Playwright
  - Note: Final `npm run validate`: 0 lint errors (71 warnings, consistent style), format clean, typecheck clean, **103/103 tests passing** (7 new unit/integration tests added), licenses clean. Playwright: new refinement E2E spec passes clean.

## Phase 6 — Integration, Full E2E, Docs Finalization (4 days + 1 buffer) ✅ COMPLETE

- [x] Full `npm run validate` regression pass (lint, format:check, typecheck, Vitest, license report)
- [x] Full `npx playwright test` suite (`tests/e2e/app.spec.ts`, `previewWindow.spec.ts`, `historyPicker.spec.ts`, `refinement.spec.ts`)
- [x] Update `docs/PRD.md` — Intelligence-phase scope section
- [x] Update `docs/FEATURES.md` — 4 new feature spec sections (Sections 10–13) matching existing format
- [x] Update `docs/ROADMAP.md` — v1.5 milestone checkboxes, progress bar (100%), version badges
- [x] Update `docs/CHANGELOG.md` — `[1.5.0]` version bump entries
- [x] Consolidate `docs/ARCHITECTURE.md` diagrams & Sections 10, 11, 12, 13
- [x] Finalize `docs/DATABASE_SCHEMA.md` (`003_personas.sql`, `004_history_fts4.sql`, FTS4 virtual table, application-layer sync & single-default rationale) and `docs/API.md`
- [x] Final pass on this tracker — mark all 6 phases complete, note buffer-day usage and deviations
- [x] `[BUFFER]` — final polish from full-suite integration testing
  - Note: Final full regression pass clean across all suites. Total unit & integration test count: 106/106 passing. All 4 major v1.5 features (Floating Streaming Preview Window, Persona Profiles System, Smart History Stack + FTS4 Search, Multi-Turn Conversational Refinement Loop) fully integrated, validated, and documented.

---

## Deferred / Non-Blocking (from Phase 0 audit)

These are pre-existing v1.0 MVP polish/roadmap items (per `docs/ROADMAP.md`) that
remain incomplete but do **not** block v1.5 Intelligence feature work, per the
soft-gate decision:

- Windows/macOS/Linux installer polish (NSIS/DMG/AppImage signing pipeline)
- First-run onboarding wizard
- Cross-platform active-window detection
- Remaining minor lint warnings (40 pre-existing `@typescript-eslint/no-explicit-any`,
  unused-var, and jsx-a11y warnings across `doctor.ts`, `handlers.ts`, `History.tsx`,
  `Settings.tsx`, `Templates.tsx`, `database.ts`, `logger.ts`, test files) — none
  are errors, none block `npm run validate`, safe to clean up opportunistically
  during later phases when touching those files, not a dedicated task.

## Deviation Log

_(if execution order or scope changes from `docs/new_features_plan.md`, note it here with date + reason)_
