# Contributing to PromptForge AI

Thank you for your interest in contributing to PromptForge AI! Every contribution matters — whether it's code, documentation, bug reports, or feature ideas.

---

## Code of Conduct

We are committed to providing a welcoming and respectful environment for everyone. Please be kind, constructive, and professional in all interactions. A detailed Code of Conduct will be published separately.

---

## Getting Started

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 20+ (LTS) | [nodejs.org](https://nodejs.org/) |
| pnpm | 8+ | `npm install -g pnpm` |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| Ollama | Latest (optional) | [ollama.ai](https://ollama.ai/) — for local AI testing |

### Development Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/PromptForgeAI.git
cd PromptForgeAI

# 3. Add the upstream remote
git remote add upstream https://github.com/promptforge/PromptForgeAI.git

# 4. Install dependencies
pnpm install

# 5. Copy the example config (if applicable)
cp config.example.json config.json

# 6. Start development mode
pnpm dev
```

> **Tip:** If you have Ollama installed, pull a model for local AI testing: `ollama pull llama3.1`

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start in development mode with hot-reload |
| `pnpm build` | Build for production |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm package` | Package for current platform |

---

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── hotkeys/        # Global hotkey registration and handling
│   ├── api/            # Local Fastify HTTP API server
│   ├── db/             # SQLite database and migrations
│   ├── services/       # Core business logic (enhancement, clipboard, context)
│   └── providers/      # AI provider integrations (Ollama, Groq, OpenAI, etc.)
├── renderer/           # Electron renderer process (React)
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application views (Settings, History, Templates)
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # State management
│   └── styles/         # Global styles and Tailwind config
├── shared/             # Types, constants, and utilities shared between processes
└── preload/            # Electron preload scripts (IPC bridge)
```

---

## Development Workflow

### Branch Naming Convention

Create a new branch from `main` using the following prefixes:

| Prefix | Use For |
|--------|---------|
| `feat/` | New features — `feat/template-variables` |
| `fix/` | Bug fixes — `fix/clipboard-paste-delay` |
| `docs/` | Documentation — `docs/api-reference-update` |
| `refactor/` | Code refactoring — `refactor/provider-factory` |
| `test/` | Adding or updating tests — `test/hotkey-manager` |
| `chore/` | Tooling, CI, dependencies — `chore/upgrade-electron` |

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Scopes:** `main`, `renderer`, `services`, `api`, `db`, `providers`, `hotkeys`, `templates`, `ui`

**Examples:**

```
feat(providers): add Gemini provider support
fix(hotkeys): resolve conflict with VS Code shortcuts on Linux
docs(api): document template CRUD endpoints
refactor(services): extract prompt enhancement pipeline
test(db): add migration rollback tests
```

### Pull Request Process

1. **Create a branch** from `main` with the appropriate naming convention
2. **Make your changes** — write clean, tested code
3. **Verify locally** — run all checks before pushing:
   ```bash
   pnpm lint && pnpm test && pnpm typecheck
   ```
4. **Push your branch** and open a Pull Request against `main`
5. **Fill out the PR template** — describe what changed and why
6. **Request a review** from a maintainer
7. **Address feedback** — push additional commits as needed
8. **Squash merge** — the maintainer will squash and merge once approved

> **Note:** PRs that fail CI checks will not be merged. Please ensure all checks pass locally first.

---

## Code Standards

### TypeScript

- **Strict mode enabled** — no implicit `any`, strict null checks
- **No `any` type** — use `unknown` when the type is genuinely unknown, then narrow
- **Prefer interfaces** over type aliases for object shapes
- **Use discriminated unions** for state management and action types
- **Export types explicitly** with `export type` or `export interface`

```typescript
// ✅ Good
interface EnhancementResult {
  status: 'success' | 'error';
  originalPrompt: string;
  enhancedPrompt: string;
  provider: ProviderName;
  durationMs: number;
}

// ❌ Avoid
type Result = any;
```

### React

- **Functional components only** — no class components
- **Custom hooks** for reusable logic (`useProvider`, `useHotkey`, `useHistory`)
- **TailwindCSS** for styling — no inline styles or CSS modules
- **Props interfaces** defined above the component

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: PaletteAction) => void;
}

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  // ...
}
```

### Import Order

Organize imports in the following order, separated by blank lines:

```typescript
// 1. Node built-ins
import path from 'node:path';
import { EventEmitter } from 'node:events';

// 2. External packages
import { app, BrowserWindow } from 'electron';
import Fastify from 'fastify';

// 3. Internal modules (absolute paths / aliases)
import { ProviderFactory } from '@/services/provider-factory';
import { DB } from '@/db/connection';

// 4. Relative imports
import { formatPrompt } from './utils';
import { SettingsPanel } from './SettingsPanel';

// 5. Type imports
import type { ProviderConfig } from '@/shared/types';
```

---

## Testing Requirements

### Unit Tests (Vitest)

Cover all services, utilities, and state stores:

```typescript
// src/main/services/__tests__/enhancer.test.ts
import { describe, it, expect } from 'vitest';
import { EnhancerService } from '../enhancer';

describe('EnhancerService', () => {
  it('should enhance a basic prompt', async () => {
    const result = await enhancer.enhance('write a poem');
    expect(result.enhancedPrompt).toBeDefined();
    expect(result.enhancedPrompt.length).toBeGreaterThan('write a poem'.length);
  });
});
```

### Integration Tests

Test IPC handlers, database operations, and API endpoints working together.

### E2E Tests (Playwright)

Cover critical user flows:
- Global hotkey triggers the enhancement flow
- Command palette opens, accepts input, and returns results
- Settings are saved and persisted
- History entries are recorded and searchable

### Coverage Targets

| Area | Target |
|------|--------|
| Services & utilities | 80%+ |
| Overall project | 70%+ |

> Run `pnpm test --coverage` to check coverage locally.

---

## Documentation

- **Update docs** when your changes affect user-facing features or APIs
- **Add JSDoc comments** to all public functions, classes, and interfaces
- **Update `CHANGELOG.md`** with a brief entry under the `[Unreleased]` section
- **Keep `README.md` in sync** if you add new commands, hotkeys, or providers

```typescript
/**
 * Enhances a prompt using the configured AI provider.
 *
 * @param prompt - The original user prompt to enhance
 * @param options - Enhancement options (mode, provider override, context)
 * @returns The enhancement result including the optimized prompt
 * @throws {ProviderError} If the AI provider is unavailable or returns an error
 */
export async function enhancePrompt(
  prompt: string,
  options?: EnhanceOptions
): Promise<EnhancementResult> {
  // ...
}
```

---

## Bug Reports

When filing a bug report, please include:

1. **Environment** — OS, Node.js version, Electron version, app version
2. **Steps to reproduce** — clear, numbered steps
3. **Expected behavior** — what should happen
4. **Actual behavior** — what actually happens
5. **Screenshots or logs** — if applicable
6. **Source application** — which app you were using when the issue occurred

---

## Feature Requests

We welcome feature ideas! When proposing a new feature:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** the feature solves
3. **Propose a solution** with as much detail as you'd like
4. **Consider alternatives** you've thought about
5. **Note any breaking changes** the feature might introduce

---

## Recognition

We believe in recognizing every contribution:

- **README** — Active contributors listed in the Contributors section
- **Release Notes** — Contributions acknowledged in each release
- **GitHub Contributors** — Automatically tracked via GitHub's contributors page

Every merged PR counts, no matter the size.

---

## Questions?

- 💬 **Open a [GitHub Discussion](../../discussions)** for questions, ideas, or general conversation
- 🐛 **Create an [Issue](../../issues)** for bugs or specific feature requests
- 📖 **Read the docs** — [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md), [DESIGN.md](./DESIGN.md)

---

Thank you for helping make PromptForge AI better! 🚀
