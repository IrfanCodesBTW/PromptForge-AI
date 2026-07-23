# PromptForge AI — System Architecture

## 1. Overview

PromptForge AI is a **local-first Electron desktop application** that enhances AI prompts via global hotkeys. The architecture follows three core principles:

- **Modular** — Each concern (hotkeys, clipboard, AI providers, templates) lives in its own isolated module with well-defined interfaces. Modules communicate through typed events and IPC channels, never through shared mutable state.
- **Event-Driven** — The entire flow is triggered by user events (hotkeys, tray clicks, command palette actions). The main process acts as an event bus, coordinating between the OS layer, renderer processes, and service layer without blocking.
- **Local-First** — All data (history, templates, configuration) is stored locally in SQLite. AI provider API keys are encrypted via the OS keychain. No telemetry, no cloud sync, no external dependencies beyond the AI providers the user explicitly configures.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        Settings[Settings Window]
        Palette[Command Palette]
        Popup[Floating Popup]
        Toast[Toast Notifications]
    end

    subgraph Main["Electron Main Process"]
        Hotkeys[Global Hotkey Manager]
        Clipboard[Clipboard Manager]
        Tray[System Tray]
        IPC[IPC Bridge]
        Window[Window Manager]
    end

    subgraph Services["Service Layer"]
        Prompt[Prompt Engine]
        Context[Context Detector]
        Template[Template Engine]
        History[History Manager]
    end

    subgraph Providers["AI Provider Layer"]
        Ollama[Ollama - Local]
        Groq[Groq]
        OpenAI[OpenAI]
        Gemini[Gemini]
        Router[OpenRouter]
    end

    subgraph Data["Data Layer"]
        SQLite[(SQLite DB)]
        Config[Config Store]
    end

    subgraph Integration["Integration Layer"]
        HTTP[Fastify HTTP API]
        MCP[MCP Server - Future]
    end

    %% Presentation → Main Process
    Settings -->|config updates| IPC
    Palette -->|commands| IPC
    Popup -->|user input| IPC

    %% Main Process internal
    Hotkeys -->|hotkey event| Clipboard
    Clipboard -->|text payload| IPC
    Tray -->|menu actions| Window
    IPC -->|events| Window
    Window -->|show/hide| Presentation

    %% Main → Services
    IPC -->|process request| Prompt
    Clipboard -->|raw text| Context
    Context -->|detected context| Template
    Template -->|compiled prompt| Prompt
    Prompt -->|enhanced prompt| History

    %% Services → Providers
    Prompt -->|API request| Ollama
    Prompt -->|API request| Groq
    Prompt -->|API request| OpenAI
    Prompt -->|API request| Gemini
    Prompt -->|API request| Router

    %% Services → Data
    History -->|read/write| SQLite
    Template -->|load templates| SQLite
    Config -->|settings| Main

    %% Integration
    HTTP -->|external trigger| IPC
    MCP -.->|future| Services

    %% Response flow back
    Providers -->|streaming response| Prompt
    Prompt -->|result| Clipboard
    Prompt -->|display| Popup
    Toast -->|notification| Presentation
```

---

## 3. Layer Descriptions

### Presentation Layer

The UI layer rendered in Electron's BrowserWindow contexts using React + Tailwind CSS.

| Component | Purpose |
|-----------|---------|
| **Settings Window** | Full configuration UI — provider keys, hotkey bindings, template management, appearance |
| **Command Palette** | Quick-access overlay (Cmd/Ctrl+Shift+P) for searching templates, history, and actions |
| **Floating Popup** | Minimal, always-on-top window showing streaming AI responses and quick actions |
| **Toast Notifications** | Non-intrusive feedback for completed operations, errors, and status updates |

### Electron Main Process

The OS-level coordinator that bridges hardware events with application logic.

| Module | Responsibility |
|--------|---------------|
| **Global Hotkey Manager** | Registers and listens for system-wide keyboard shortcuts via `globalShortcut` API |
| **Clipboard Manager** | Reads/writes system clipboard, handles rich text and plain text formats |
| **System Tray** | Persistent tray icon with context menu for quick access and status indication |
| **IPC Bridge** | Type-safe bidirectional communication between main and renderer processes |
| **Window Manager** | Creates, positions, and manages BrowserWindow lifecycle (show/hide/focus) |

### Service Layer

Business logic that is process-agnostic — can run in main process or be extracted to a worker.

| Service | Responsibility |
|---------|---------------|
| **Prompt Engine** | Orchestrates the full enhancement pipeline: context → template → provider → response |
| **Context Detector** | Analyzes clipboard content to determine type (code, prose, email, chat) and language |
| **Template Engine** | Compiles Handlebars/Mustache templates with context variables, supports custom user templates |
| **History Manager** | Persists all prompt/response pairs with metadata for search and replay |

### AI Provider Layer

Adapter pattern — each provider implements a common `AIProvider` interface.

| Provider | Type | Use Case |
|----------|------|----------|
| **Ollama** | Local | Privacy-first, offline operation, no API key needed |
| **Groq** | Cloud | Ultra-fast inference for real-time enhancement |
| **OpenAI** | Cloud | GPT-4o/o1 for complex reasoning tasks |
| **Gemini** | Cloud | Google models, multimodal support |
| **OpenRouter** | Cloud | Access to 100+ models through single API key |

### Data Layer

| Store | Technology | Purpose |
|-------|-----------|---------|
| **SQLite DB** | better-sqlite3 | Prompt history, templates, usage analytics |
| **Config Store** | electron-store | App settings, window positions, feature flags |

### Integration Layer

| Interface | Purpose |
|-----------|---------|
| **Fastify HTTP API** | Local REST API (localhost:9721) for external tool integration, Alfred/Raycast workflows |
| **MCP Server** | (Future) Model Context Protocol server for AI agent integration |

---

## 4. Core Data Flow

```mermaid
sequenceDiagram
    participant User
    participant OS as Operating System
    participant Main as Main Process
    participant Clip as Clipboard Manager
    participant Ctx as Context Detector
    participant Tpl as Template Engine
    participant AI as AI Provider
    participant Popup as Floating Popup

    User->>OS: Triggers global hotkey (e.g., Ctrl+Shift+E)
    OS->>Main: Hotkey event captured
    Main->>Clip: Read clipboard contents
    Clip-->>Main: Raw text payload

    Main->>Ctx: Analyze content type
    Ctx-->>Main: Context metadata (type, language, intent)

    Main->>Tpl: Select & compile template
    Note over Tpl: Uses context to pick best<br/>template and inject variables
    Tpl-->>Main: Compiled prompt string

    Main->>AI: Send to configured provider
    Note over AI: Streaming response begins

    AI-->>Popup: Stream chunks (via IPC)
    Popup->>User: Display real-time response

    AI-->>Main: Complete response
    Main->>Clip: Write enhanced text to clipboard

    Main->>OS: Simulate Ctrl+V (auto-paste)
    OS->>User: Enhanced text pasted in active app

    Main->>Main: Save to history (async)
```

---

## 5. IPC Communication

```mermaid
flowchart LR
    subgraph Renderer["Renderer Process (React)"]
        direction TB
        UI[UI Components]
        Store[Zustand Store]
        Hook[useIPC Hook]
    end

    subgraph Bridge["IPC Bridge"]
        direction TB
        Invoke[ipcRenderer.invoke]
        On[ipcRenderer.on]
        Send[ipcMain.handle]
        Emit[webContents.send]
    end

    subgraph MainProc["Main Process"]
        direction TB
        Handlers[IPC Handlers]
        Events[Event Emitter]
        Services[Service Layer]
    end

    %% Request flow (Renderer → Main)
    UI -->|user action| Hook
    Hook -->|typed call| Invoke
    Invoke -->|channel: prompt:enhance| Send
    Send --> Handlers
    Handlers --> Services

    %% Response flow (Main → Renderer)
    Services --> Events
    Events -->|result| Emit
    Emit -->|channel: prompt:result| On
    On -->|update| Store
    Store -->|re-render| UI

    %% Streaming flow
    Services -.->|chunk| Emit
    Emit -.->|channel: stream:chunk| On
    On -.->|append| Store
```

### IPC Channel Registry

| Channel | Direction | Payload | Purpose |
|---------|-----------|---------|---------|
| `prompt:enhance` | Renderer → Main | `{ text, options }` | Trigger prompt enhancement |
| `prompt:result` | Main → Renderer | `{ result, metadata }` | Return enhanced prompt |
| `stream:chunk` | Main → Renderer | `{ chunk, done }` | Stream partial responses |
| `config:get` | Renderer → Main | `{ key }` | Read configuration value |
| `config:set` | Renderer → Main | `{ key, value }` | Update configuration |
| `history:query` | Renderer → Main | `{ filters, pagination }` | Query prompt history |
| `template:list` | Renderer → Main | `{ category? }` | List available templates |
| `provider:test` | Renderer → Main | `{ provider, apiKey }` | Test provider connection |
| `hotkey:register` | Renderer → Main | `{ combo, action }` | Register new hotkey |
| `window:toggle` | Main → Renderer | `{ window, visible }` | Window visibility change |

---

## 6. Directory Structure

```
promptforge-ai/
├── src/
│   ├── main/                   # Electron main process
│   │   ├── hotkeys/            # Global hotkey registration & management
│   │   │   ├── manager.ts      # Hotkey lifecycle (register/unregister)
│   │   │   └── defaults.ts     # Default hotkey bindings
│   │   ├── clipboard/          # System clipboard operations
│   │   │   ├── reader.ts       # Read clipboard (text, rich text, image)
│   │   │   └── writer.ts       # Write to clipboard + auto-paste
│   │   ├── tray/               # System tray icon & menu
│   │   │   └── tray.ts         # Tray setup and context menu
│   │   ├── ipc/                # IPC channel handlers
│   │   │   ├── handlers.ts     # All ipcMain.handle registrations
│   │   │   └── channels.ts     # Type-safe channel definitions
│   │   ├── windows/            # Window creation & management
│   │   │   ├── settings.ts     # Settings window factory
│   │   │   ├── popup.ts        # Floating popup window
│   │   │   └── palette.ts      # Command palette overlay
│   │   └── index.ts            # Main entry point, app lifecycle
│   │
│   ├── renderer/               # React frontend (Vite bundled)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Base components (Button, Input, Card)
│   │   │   ├── prompt/         # Prompt-specific components
│   │   │   └── provider/       # Provider config components
│   │   ├── pages/              # Full page views
│   │   │   ├── Settings.tsx    # Settings page
│   │   │   ├── History.tsx     # Prompt history browser
│   │   │   └── Templates.tsx   # Template manager
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useIPC.ts       # Type-safe IPC communication
│   │   │   └── useStream.ts    # Streaming response handler
│   │   ├── stores/             # Zustand state stores
│   │   │   ├── appStore.ts     # Global app state
│   │   │   └── promptStore.ts  # Active prompt state
│   │   └── App.tsx             # Root component + router
│   │
│   ├── services/               # Shared business logic
│   │   ├── ai/                 # AI provider adapters
│   │   │   ├── provider.ts     # AIProvider interface
│   │   │   ├── ollama.ts       # Ollama adapter
│   │   │   ├── groq.ts         # Groq adapter
│   │   │   ├── openai.ts       # OpenAI adapter
│   │   │   ├── gemini.ts       # Gemini adapter
│   │   │   ├── openrouter.ts   # OpenRouter adapter
│   │   │   └── router.ts       # Provider selection logic
│   │   ├── prompt/             # Prompt processing engine
│   │   │   ├── engine.ts       # Main orchestrator
│   │   │   └── enhancer.ts     # Prompt enhancement strategies
│   │   ├── context/            # Context detection
│   │   │   ├── detector.ts     # Content type analysis
│   │   │   └── patterns.ts     # Detection patterns & heuristics
│   │   ├── template/           # Template engine
│   │   │   ├── compiler.ts     # Template compilation & caching
│   │   │   └── loader.ts       # Template file loader
│   │   └── db/                 # Database layer
│   │       ├── database.ts     # SQLite connection & setup
│   │       ├── history.ts      # History CRUD operations
│   │       └── templates.ts    # Template CRUD operations
│   │
│   ├── server/                 # Local HTTP API (Fastify)
│   │   ├── index.ts            # Server bootstrap
│   │   ├── routes/             # API route definitions
│   │   └── auth.ts             # Bearer token middleware
│   │
│   └── shared/                 # Shared types and utilities
│       ├── types.ts            # TypeScript interfaces & types
│       ├── constants.ts        # App-wide constants
│       └── utils.ts            # Shared utility functions
│
├── resources/                  # Static assets
│   ├── icons/                  # App icons (all sizes)
│   └── sounds/                 # Notification sounds (optional)
│
├── templates/                  # Built-in prompt templates
│   ├── enhance/                # General enhancement templates
│   ├── code/                   # Code-specific templates
│   ├── writing/                # Writing & prose templates
│   └── custom/                 # User-created templates
│
├── migrations/                 # SQLite schema migrations
│   ├── 001_initial.sql         # History, templates tables
│   └── 002_analytics.sql       # Usage tracking tables
│
├── tests/                      # Test suite
│   ├── unit/                   # Unit tests (Vitest)
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests (Playwright)
│
├── electron-builder.yml        # Electron build configuration
├── vite.config.ts              # Vite bundler config
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
└── README.md                   # Project documentation
```

---

## 7. Security Model

PromptForge AI is designed with a **zero-trust, local-first** security posture.

### Principles

| Principle | Implementation |
|-----------|---------------|
| **No Telemetry** | Zero outbound requests except to user-configured AI providers. No analytics, no crash reporting, no update checks without consent. |
| **API Key Encryption** | All provider API keys stored via OS keychain (`keytar`): Windows Credential Vault, macOS Keychain, Linux Secret Service. Never written to disk in plaintext. |
| **Minimal Clipboard Access** | Clipboard is read **only** on explicit hotkey trigger, never polled or monitored in background. Read → process → write is atomic. |
| **Local HTTP API Auth** | The Fastify server binds to `127.0.0.1` only. All requests require a bearer token generated on first launch and stored in OS keychain. |
| **Process Isolation** | Renderer processes run with `contextIsolation: true`, `nodeIntegration: false`. All Node.js access goes through the preload script's typed IPC bridge. |
| **No Remote Code** | No `eval()`, no remote module loading, CSP headers enforced in all windows. |

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Clipboard sniffing by malware | Clipboard access is momentary; data is not cached beyond the active operation |
| API key extraction from memory | Keys loaded from keychain on-demand, zeroed after use in provider calls |
| Local HTTP API abuse | Bound to localhost + bearer token + optional allowlist of calling processes |
| Supply chain attack | Pinned dependencies, lockfile integrity checks, Electron's built-in sandboxing |

---

## 8. Performance Considerations

### Streaming Responses

AI responses stream token-by-token to the floating popup via IPC. The user sees output immediately rather than waiting for full completion. Backpressure is handled by buffering chunks in 50ms batches before IPC transmission.

### Lazy Loading

- Settings window and history browser are created on-demand, not at startup
- Template files loaded only when their category is accessed
- Provider adapters instantiated only when first used

### Connection Pooling

Each AI provider adapter maintains a persistent HTTP agent with keep-alive connections. Connection pool size is configurable per provider (default: 4 concurrent connections for cloud, unlimited for local Ollama).

### Template Compilation Caching

Handlebars templates are compiled once and cached in an LRU cache (max 100 entries). Cache invalidation occurs only on template file modification (watched via `fs.watch`).

### Memory Footprint

| State | Target Memory |
|-------|--------------|
| Idle (tray only) | < 50 MB |
| Active (popup open) | < 120 MB |
| Settings window open | < 180 MB |

Achieved through:
- Deferred window creation
- Aggressive garbage collection hints after large responses
- SQLite WAL mode for non-blocking reads
- History pagination (never load full dataset into memory)

### Startup Time

Target: **< 800ms** from launch to hotkey-ready.

- Preload only: hotkey registration, tray creation, clipboard module
- Defer: provider health checks, template indexing, HTTP server boot

---

## 9. Scalability

### Plugin Architecture (v2 Roadmap)

```mermaid
flowchart LR
    subgraph Core["PromptForge Core"]
        Engine[Prompt Engine]
        API[Plugin API]
    end

    subgraph Plugins["Plugin Ecosystem"]
        P1[Custom Provider]
        P2[Context Plugin]
        P3[Template Pack]
        P4[Output Formatter]
    end

    API --> P1
    API --> P2
    API --> P3
    API --> P4
    P1 --> Engine
    P2 --> Engine
    P3 --> Engine
    P4 --> Engine
```

Plugins will be sandboxed Node.js modules that implement defined interfaces:
- `ProviderPlugin` — Add new AI providers
- `ContextPlugin` — Add new content detection strategies
- `TemplatePlugin` — Bundle template packs
- `FormatterPlugin` — Custom output post-processing

### Provider Adapter Pattern

All AI providers implement a common interface:

```typescript
interface AIProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  complete(prompt: string, options: CompletionOptions): AsyncIterable<string>;
  models(): Promise<Model[]>;
}
```

Adding a new provider requires only implementing this interface and registering it with the provider router. Zero changes to the prompt engine or UI.

### Template Hot-Reload

Templates in the `templates/` directory are watched for changes. On modification:
1. File watcher detects change
2. Template is recompiled and cache entry is invalidated
3. Next prompt enhancement uses the updated template
4. No app restart required

Users can add templates by dropping `.hbs` files into the templates directory or through the Settings UI.

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 33+ (Chromium + Node.js) |
| Frontend | React 19, Tailwind CSS 4, Zustand |
| Bundler | Vite 6 (renderer), esbuild (main) |
| Database | SQLite via better-sqlite3 |
| HTTP Server | Fastify 5 |
| AI SDKs | Vercel AI SDK (unified streaming interface) |
| Testing | Vitest (unit), Playwright (e2e) |
| Build | electron-builder (cross-platform packaging) |
| Language | TypeScript 5.x (strict mode) throughout |


---

## 10. Floating Preview Window (v1.5)

### Overview

The Floating Preview Window is a second, independent `BrowserWindow` spawned by the `HotkeyManager` when the `preview_window_enabled` setting is on. It streams the live enhancement output near the user's cursor and lets the user Accept, Reject, or Re-run before anything is written to the clipboard. When the setting is off, hotkeys fall back to the original V1 instant-clipboard behavior unchanged.

Key design points (matching the actual implementation, not aspirational):

- **Window**: `src/main/windows/previewWindow.ts` creates a `BrowserWindow` with `alwaysOnTop: true`, `skipTaskbar: true`, `frame: false`, `transparent: true`, `resizable: false`, sized 420×280, positioned at `screen.getCursorScreenPoint()` + 16px on both axes. It auto-dismisses on blur (focus loss) or explicit close, and is reused (repositioned, not recreated) across Re-run.
- **Isolation**: The preview window loads a dedicated renderer bundle (`src/renderer/preview/`, built as a separate Vite entry point in `electron.vite.config.ts`) with its own `PreviewApp.tsx`. The main application window has zero code path that references the preview window — all lifecycle and streaming orchestration lives in `HotkeyManager`.
- **Streaming source**: `HotkeyManager` calls `PromptEngine.enhanceStream()` (added in the Phase 1 Streaming Infrastructure work) and forwards each `TokenChunk` to the preview window via `previewWindow.ts`'s `sendTokenChunk()`/`sendStreamDone()`/`sendStreamError()` helpers over dedicated IPC channels.
- **Hybrid fallback**: If the active provider can't stream (or the stream fails mid-flight), `ProviderRouter.streamWithFallback()` transparently falls back to a normal `complete()` call. The preview UI shows a subtle "Streaming unavailable — displaying completed response" notice rather than an error, and still renders the full result.
- **Actions own the clipboard write**: Unlike V1, the clipboard is untouched until the user explicitly Accepts. `HotkeyManager.handlePreviewAccept()`/`handlePreviewReject()`/`handlePreviewRerun()` are invoked via IPC from the preview renderer and manage a small in-memory `pendingPreview` state (input text, mode, latest streamed text) — nothing is persisted beyond the existing history write that already happens inside `enhanceStream()`.
- **Feature flag**: Controlled by the `preview_window_enabled` setting (Settings → General → "Floating Preview Window"), defaulting to off for the initial rollout so existing users' instant-clipboard workflow is unaffected until they opt in.

### Sequence Diagram — Token Streaming Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant OS
    participant HotkeyManager
    participant PreviewWindow as previewWindow.ts
    participant PreviewApp as Preview Renderer
    participant Engine as PromptEngine
    participant Router as ProviderRouter
    participant Provider as AIProvider (Ollama/Groq/OpenAI)

    User->>OS: Press Ctrl+Shift+E (preview_window_enabled = true)
    OS->>HotkeyManager: Trigger Shortcut Event
    HotkeyManager->>OS: Copy Selected Text (Ctrl+C Simulation)
    OS-->>HotkeyManager: selected text
    HotkeyManager->>PreviewWindow: getOrCreatePreviewWindow()
    PreviewWindow->>PreviewApp: load preview/index.html near cursor
    HotkeyManager->>Engine: enhanceStream(text, mode)
    Engine->>Router: streamWithFallback(userPrompt, systemPrompt)
    Router->>Provider: completeStream() [if implemented]

    loop each token chunk
        Provider-->>Router: TokenChunk
        Router-->>Engine: TokenChunk
        Engine-->>HotkeyManager: EnhanceStreamChunk
        HotkeyManager->>PreviewWindow: sendTokenChunk(chunk)
        PreviewWindow->>PreviewApp: IPC preview:token-chunk
        PreviewApp->>User: append token, blinking cursor
    end

    alt streaming failed or unsupported
        Router->>Provider: complete() (non-streaming fallback)
        Provider-->>Router: full CompletionResult
        Router-->>Engine: synthetic done chunk (isFallback)
        Engine-->>HotkeyManager: final EngineResult (usedStreamFallback: true)
    else streaming succeeded
        Engine-->>HotkeyManager: final EngineResult
    end

    Engine->>Engine: write to prompt_history (HistoryService)
    HotkeyManager->>PreviewWindow: sendStreamDone(result)
    PreviewWindow->>PreviewApp: IPC preview:stream-done
    PreviewApp->>User: enable Accept, show provider/latency pill

    alt User clicks Accept (or presses Enter)
        PreviewApp->>HotkeyManager: IPC preview:accept
        HotkeyManager->>OS: write to clipboard (+ optional auto-paste)
        HotkeyManager->>PreviewWindow: closePreviewWindow()
    else User clicks Reject (or presses Escape)
        PreviewApp->>HotkeyManager: IPC preview:reject
        HotkeyManager->>PreviewWindow: closePreviewWindow() (no clipboard write)
    else User clicks Re-run (or presses Ctrl+R)
        PreviewApp->>HotkeyManager: IPC preview:rerun
        HotkeyManager->>Engine: enhanceStream(same text, same mode)
        Note over PreviewApp: text cleared, loop repeats from step 8
    end
```

### IPC Channels

| Channel | Direction | Payload |
|---|---|---|
| `promptforge:preview:token-chunk` | Main → Renderer | `{ text, done, provider, isFallback }` |
| `promptforge:preview:stream-done` | Main → Renderer | `{ enhanced, provider, model, tokensUsed, latencyMs, historyId, usedStreamFallback }` |
| `promptforge:preview:stream-error` | Main → Renderer | `{ code, message }` |
| `promptforge:preview:accept` | Renderer → Main | — |
| `promptforge:preview:reject` | Renderer → Main | — |
| `promptforge:preview:rerun` | Renderer → Main | — |

---

## 11. Multi-Turn Refinement Loop (v1.5)

### Overview

The Multi-Turn Refinement Loop enables users to iteratively refine an enhanced prompt using natural language instructions directly inside the preview window before accepting the final version.

Key architectural design points:

- **In-Memory Session Manager**: Managed by `RefinementSessionManager` (`src/services/refinementSession.ts`). Sessions hold active conversation context (`originalText`, `currentOutput`, `turns: RefinementTurn[]`, `mode`, `provider`) and automatically expire after a configurable inactivity duration (default 5 minutes).
- **Sub-800 Token Prompt Budgeting**: System and user prompts for refinement turns assemble original context, previous turn history, user instructions, and active persona injection (`PersonaService`) within a tight sub-800 token budget.
- **Provider Streaming**: Utilizes Phase 1's `ProviderRouter.streamWithFallback()` for real-time incremental token streaming (`promptforge:refinement:token-chunk`).
- **Interactive UI**: Embedded 36px input bar in `PreviewApp.tsx` with turn history thread visualization. "Use as Base" in the Ctrl+Shift+H history picker initializes a new refinement session from past history entries.

### Sequence Diagram — Multi-Turn Refinement Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant PreviewApp as Preview Renderer
    participant Handlers as Main IPC Handlers
    participant Manager as RefinementSessionManager
    participant Session as RefinementSession
    participant Router as ProviderRouter

    User->>PreviewApp: Types refinement instruction & presses Enter
    PreviewApp->>Handlers: IPC promptforge:refinement:send-instruction
    Handlers->>Manager: getSession(sessionId)
    Manager-->>Handlers: RefinementSession instance
    Handlers->>Session: refine(instruction)
    Session->>Router: streamWithFallback(userPrompt, systemPrompt)

    loop each token chunk
        Router-->>Session: TokenChunk
        Session-->>Handlers: EnhanceStreamChunk
        Handlers->>PreviewApp: IPC promptforge:refinement:token-chunk
        PreviewApp->>User: Update live token display
    end

    Session-->>Handlers: EngineResult
    Handlers->>PreviewApp: IPC promptforge:refinement:done
    PreviewApp->>User: Append turn to conversation thread
```

All channels are registered in `IPC_CHANNELS` (`src/shared/constants.ts`), whitelisted in the preload bridge (`src/preload/index.ts`), and the accept/reject/rerun handlers are wired in `src/main/ipc/handlers.ts`, delegating to `HotkeyManager`.

---

## 12. Persona Profiles System (v1.5)

### Overview

The Persona Profiles system enables users to define custom prompt identities (`personas` table in SQLite) that inject structured constraints (tone, format rules, system prompt injection) into every prompt enhancement.

Key architectural design points:

- **System Prompt Composition**: Formatted as `[persona.systemPromptInjection] + '\n\n---\n\n' + [template/mode system prompt]`. Persona provides the outer identity/tone frame, while mode/template provides the task layer.
- **Opt-Out Flag**: Preserves pre-Persona behavior for built-in templates (`persona_override_allowed = 0`), while allowing user templates to toggle persona overrides (`DEFAULT 1`).
- **Tray Menu Integration**: Dynamic system tray "Persona" radio-item submenu allowing single-click switching of default persona.
- **Application-Layer Transactional Guarantees**: Single-default persona enforcement is managed in `PersonaService` using explicit SQL transactions (`UPDATE personas SET is_default = 0; UPDATE personas SET is_default = 1 WHERE id = ?`).

---

## 13. Smart History Stack & FTS4 Search (v1.5)

### Overview

Smart History Search combines an inverted index SQLite FTS4 virtual table (`prompt_history_fts`) with a lightweight quick picker popup window (`Ctrl+Shift+H`) and side-by-side diff visualization.

Key architectural design points:

- **FTS4 Inverted Index**: `CREATE VIRTUAL TABLE prompt_history_fts USING fts4(original_text, enhanced_text, content='prompt_history')`. Full-text queries use SQLite `MATCH` syntax with term-frequency ranking.
- **Application-Layer Sync**: FTS index synchronization (insert, delete, restore) is executed inside `HistoryService` within database transactions.
- **Quick Picker Popup**: Frameless `560×480px` window (`src/main/windows/historyWindow.ts`) with debounced search, matched term highlighting (`<mark>`), 4-second undo toast, and keyboard navigation.
- **Unified Search Backend**: Both the `Ctrl+Shift+H` popup and main in-app History tab share the exact same `HistoryService.getRecentHistory()` backend method.
