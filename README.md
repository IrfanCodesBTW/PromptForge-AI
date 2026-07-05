<div align="center">

# ⚡ PromptForge AI

**Enhance any prompt, from any app, with a single hotkey.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](#installation)
[![Version](https://img.shields.io/badge/Version-0.1.0-orange.svg)](./CHANGELOG.md)

</div>

---

## What is PromptForge AI?

PromptForge AI is a local-first desktop application that supercharges your AI prompts without breaking your flow. Select any text in any application, trigger a global hotkey, and instantly receive an optimized, context-aware prompt — all processed locally or through your preferred AI provider. No copy-pasting between apps, no context switching, no data leaving your machine unless you choose otherwise.

---

## ✨ Key Features

- **🌐 System-Wide Hotkeys** — Trigger prompt enhancement from any application with customizable global shortcuts
- **🔒 Local-First Privacy** — All data stored locally in SQLite; your prompts never leave your machine unless you opt in to cloud providers
- **🤖 Multiple AI Providers** — Seamless support for Ollama (local), Groq, OpenAI, Gemini, Anthropic, and OpenRouter
- **🧠 Smart Context Detection** — Automatically detects the source application and adjusts enhancement strategies accordingly
- **📝 Prompt Templates** — Create, save, and share reusable prompt templates for common workflows
- **📜 Prompt History** — Full searchable history with before/after comparisons and usage analytics
- **🎯 Floating Command Palette** — A beautiful, minimal overlay that appears exactly where you need it
- **🔌 Extensible Architecture** — Plugin-ready design with a local Fastify API and MCP protocol support

---

<!-- demo gif here -->

---

## 🚀 Installation

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | [Download](https://nodejs.org/) |
| pnpm | 8+ | `npm install -g pnpm` |
| Git | Latest | [Download](https://git-scm.com/) |
| Ollama | Latest | Optional — for local AI inference ([Download](https://ollama.ai/)) |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/PromptForgeAI.git
cd PromptForgeAI

# Install dependencies
pnpm install

# Start in development mode
pnpm dev
```

### Build for Production

```bash
# Build the application
pnpm build

# Package for your platform
pnpm package
```

---

## ⚙️ Configuration

### AI Providers

Configure your preferred AI providers in **Settings → Providers** or edit the config file directly:

```jsonc
// config.json
{
  "providers": {
    "ollama": {
      "enabled": true,
      "baseUrl": "http://localhost:11434",
      "model": "llama3.1"
    },
    "groq": {
      "enabled": false,
      "apiKey": "gsk_...",
      "model": "llama-3.1-70b-versatile"
    },
    "openai": {
      "enabled": false,
      "apiKey": "sk-...",
      "model": "gpt-4o"
    },
    "gemini": {
      "enabled": false,
      "apiKey": "...",
      "model": "gemini-1.5-pro"
    },
    "anthropic": {
      "enabled": false,
      "apiKey": "sk-ant-...",
      "model": "claude-sonnet-4-20250514"
    },
    "openrouter": {
      "enabled": false,
      "apiKey": "sk-or-...",
      "model": "auto"
    }
  }
}
```

> **Tip:** For fully offline usage, install [Ollama](https://ollama.ai/) and pull a model: `ollama pull llama3.1`

### Hotkey Customization

Override default hotkeys in **Settings → Hotkeys** or via config:

```jsonc
{
  "hotkeys": {
    "enhance": "Ctrl+Shift+E",
    "expand": "Ctrl+Shift+X",
    "compress": "Ctrl+Shift+C",
    "palette": "Ctrl+Shift+P"
  }
}
```

---

## ⌨️ Default Hotkeys

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+E` | **Enhance** | Optimize the selected prompt for clarity and effectiveness |
| `Ctrl+Shift+X` | **Expand** | Expand a brief prompt into a detailed, comprehensive version |
| `Ctrl+Shift+C` | **Compress** | Condense a verbose prompt into a concise version |
| `Ctrl+Shift+P` | **Command Palette** | Open the floating command palette for all actions |
| `Ctrl+Shift+T` | **Templates** | Quick access to saved prompt templates |
| `Ctrl+Shift+H` | **History** | Browse recent prompt enhancements |
| `Escape` | **Dismiss** | Close the floating palette or cancel current action |

> On macOS, replace `Ctrl` with `Cmd`.

---

## 🖥️ Supported Applications

PromptForge AI works with **any application** that supports text selection and clipboard operations:

| Category | Applications |
|----------|-------------|
| **Code Editors** | VS Code, Cursor, JetBrains IDEs (IntelliJ, WebStorm, PyCharm, etc.) |
| **Browsers** | Chrome, Firefox, Edge, Brave, Arc |
| **Communication** | Slack, Discord, Teams, Telegram |
| **Productivity** | Microsoft Word, Obsidian, Notion, Google Docs |
| **AI Chat UIs** | ChatGPT, Claude, Gemini, any web-based AI interface |
| **Other** | Any application with an editable text field |

---

## 🏗️ Architecture

PromptForge AI is built on a modern Electron + React + TypeScript + Vite stack with a clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           Electron Main Process          │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Hotkeys │ │ Fastify  │ │ SQLite   │ │
│  │ Manager │ │ API      │ │ Database │ │
│  └─────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────┤
│         Electron Renderer (React)        │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Command │ │ Settings │ │ History  │ │
│  │ Palette │ │ Panel    │ │ View     │ │
│  └─────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────┤
│            AI Provider Layer             │
│  Ollama │ Groq │ OpenAI │ Gemini │ ... │
└─────────────────────────────────────────┘
```

For a detailed breakdown of the architecture, modules, and data flow, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, module design, and data flow |
| [TECH_STACK.md](./TECH_STACK.md) | Technology choices and rationale |
| [FEATURES.md](./FEATURES.md) | Detailed feature specifications |
| [DESIGN.md](./DESIGN.md) | UI/UX design system and guidelines |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | SQLite schema and migration strategy |
| [API.md](./API.md) | Local Fastify HTTP API reference |
| [MCP.md](./MCP.md) | Model Context Protocol integration |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap and milestones |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and release notes |

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug reports, feature requests, documentation improvements, or code contributions — we appreciate your help.

Please read our **[Contributing Guide](./CONTRIBUTING.md)** for details on:
- Code of Conduct
- Development setup
- Pull request process
- Coding standards

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for prompt engineers who refuse to leave their flow.**

</div>
