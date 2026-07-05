# Technology Stack

## Overview

PromptForge AI is built on modern, performant, and well-supported ecosystems. Our technology philosophy prioritizes developer experience, runtime performance, and long-term maintainability. We choose battle-tested tools with active communities, favoring technologies that work harmoniously in the Electron + React paradigm while keeping the architecture local-first and privacy-respecting.

## Core Technologies

### Desktop Shell

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| Electron | 30+ | Desktop shell, system APIs | Mature cross-platform, globalShortcut API, clipboard API, tray support, large ecosystem |
| electron-vite | 2.x | Build tooling | Fast HMR, optimized builds for Electron |
| electron-builder | 24+ | Packaging & distribution | Cross-platform installers, auto-update support |

### Frontend

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| React | 18+ | UI framework | Component model, hooks, massive ecosystem |
| TypeScript | 5.4+ | Type safety | Catch errors at compile time, better DX |
| Vite | 5+ | Frontend bundler | Fast HMR, optimized builds |
| TailwindCSS | 3.4+ | Styling | Utility-first, small bundle, dark mode support |
| Zustand | 4+ | State management | Lightweight, no boilerplate, works well with Electron IPC |
| Framer Motion | 11+ | Animations | Smooth, accessible animations for floating UI |

### Backend / Services

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| Node.js | 20+ | Runtime | LTS, native module support, Electron's runtime |
| Fastify | 4+ | Local HTTP API | Fast, schema validation, low overhead |
| better-sqlite3 | 9+ | Database | Synchronous, fast, used by Signal Desktop, great Electron support |

### AI Integration

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| ollama-js | 0.5+ | Ollama client | Official SDK, streaming support |
| groq-sdk | 0.5+ | Groq client | Official SDK, fast inference |
| openai | 4+ | OpenAI/OpenRouter client | Industry standard, compatible with many providers |
| @google/generative-ai | 0.12+ | Gemini client | Official Google AI SDK |

### Testing

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| Vitest | 1+ | Unit/integration tests | Fast, Vite-native, TypeScript support |
| Playwright | 1.40+ | E2E testing | Cross-platform, Electron support |
| @testing-library/react | 14+ | Component testing | User-centric testing approach |

### Developer Tools

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| ESLint | 8+ | Linting | Code quality, catch issues early |
| Prettier | 3+ | Formatting | Consistent code style |
| pnpm | 8+ | Package manager | Fast, disk efficient, strict dependencies |
| Husky | 9+ | Git hooks | Pre-commit linting/testing |
| lint-staged | 15+ | Staged file linting | Only lint changed files |

## Architecture Decisions

### Why Electron over Tauri?

- Mature ecosystem with extensive documentation
- Native module support (better-sqlite3 works out of the box)
- globalShortcut and clipboard APIs are battle-tested
- Larger community for troubleshooting
- Electron Forge / electron-builder for distribution
- Trade-off: Larger bundle size (~150MB vs ~10MB), higher memory usage

### Why better-sqlite3 over other databases?

- Synchronous API (simpler code, no callback hell)
- Used by Signal Desktop (proven in production Electron apps)
- Single file database (easy backup, portable)
- No external database server needed (local-first)
- Full SQL support with FTS5 for search

### Why Zustand over Redux/MobX?

- Minimal boilerplate
- Works seamlessly with Electron IPC patterns
- Small bundle size (~1KB)
- No providers/wrappers needed
- Supports middleware (persist, devtools)

### Why Fastify over Express?

- 2-3x faster request handling
- Built-in JSON schema validation
- TypeScript-first design
- Plugin architecture matches our needs
- Lower memory footprint for always-running service

## Dependency Management

- **Package manager:** pnpm (workspace support, strict mode)
- **Lock file:** pnpm-lock.yaml committed to repo
- **Version strategy:** Exact versions for production deps, caret for dev deps
- **Security:** Regular `pnpm audit` in CI

## Build & Distribution

- **Development:** `electron-vite` for fast iteration
- **Production:** `electron-builder` for installers
- **Platforms:** Windows (NSIS), macOS (DMG), Linux (AppImage/deb)
- **Auto-update:** electron-updater with GitHub Releases
- **Code signing:** Required for macOS/Windows distribution
