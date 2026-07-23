# PromptForge AI PRD

## Universal AI Prompt Enhancer (Desktop + Local AI + Global Hotkeys)

## 1. Product Overview

**Product Name:** PromptForge AI

**Vision:**\
PromptForge AI is a local-first desktop application that enhances AI
prompts from any application using global hotkeys. Users simply select
text, trigger a shortcut, and receive an optimized prompt without
leaving their workflow.

------------------------------------------------------------------------

## 2. Problem Statement

Current prompt engineering workflows interrupt productivity:

1.  Write a prompt.
2.  Open an AI chat.
3.  Ask it to improve the prompt.
4.  Copy the result.
5.  Paste it back.

PromptForge eliminates these steps with instant, system-wide prompt
enhancement.

------------------------------------------------------------------------

## 3. Goals

-   Universal prompt enhancement across applications
-   Local-first with Ollama support
-   Optional cloud providers (Groq, Gemini, OpenAI, OpenRouter)
-   Privacy-focused
-   Fast (\<2 second target)
-   Extensible template system
-   Open-source architecture

### Non-Goals

-   Not another chatbot
-   Not an AI IDE
-   Not only a prompt library

------------------------------------------------------------------------

## 4. Target Users

-   Developers
-   Designers
-   Students
-   Researchers
-   Product Managers
-   Marketers
-   Prompt Engineers

------------------------------------------------------------------------

## 5. Core Workflow

``` text
Select Text
      ↓
Press Global Hotkey
      ↓
Capture Selected Text
      ↓
Detect Context
      ↓
Apply Prompt Template
      ↓
Send to AI Provider
      ↓
Receive Optimized Prompt
      ↓
Replace Selected Text
```

------------------------------------------------------------------------

## 6. Supported Applications

-   VS Code
-   Cursor
-   Antigravity
-   Chrome
-   Firefox
-   Edge
-   Slack
-   Discord
-   Microsoft Word
-   Obsidian
-   JetBrains IDEs
-   Any editable text field

------------------------------------------------------------------------

## 7. Core Features

### Prompt Enhancement

-   Rewrite prompts professionally
-   Preserve user intent
-   Improve clarity
-   Add missing context
-   Improve output formatting

### Global Hotkeys

-   Enhance Prompt
-   Expand Prompt
-   Compress Prompt
-   Explain Prompt
-   Translate
-   Grammar Fix
-   Convert to PRD
-   Convert to Markdown
-   Convert Notes to Prompt

### Smart Context Detection

Automatically classify prompts:

-   Coding
-   UI/UX
-   Research
-   Startup
-   Marketing
-   Writing
-   Automation
-   Image Generation

Each category uses a specialized optimization template.

------------------------------------------------------------------------

## 8. AI Provider Layer

### Local

-   Ollama
-   LM Studio

### Cloud

-   Groq
-   Gemini
-   OpenAI
-   Anthropic
-   OpenRouter
-   Any OpenAI-compatible endpoint

------------------------------------------------------------------------

## 9. Prompt Templates

Built-in templates:

-   Coding
-   UI/UX
-   Product Requirements
-   Research
-   Marketing
-   SEO
-   Startup
-   Business
-   Automation
-   Image Generation
-   Video Generation

Users can create custom templates.

------------------------------------------------------------------------

## 10. Prompt History

Store:

-   Original prompt
-   Enhanced prompt
-   Provider
-   Model
-   Timestamp
-   Template used

Search, tag, and favorite prompts.

------------------------------------------------------------------------

## 11. Floating Command Palette

Display available actions from a global shortcut.

Examples:

-   Enhance
-   Professional Rewrite
-   Research Mode
-   Coding Mode
-   UI/UX Mode
-   Translate
-   Explain
-   Summarize

------------------------------------------------------------------------

## 12. Privacy

-   Local-first
-   Offline with Ollama
-   No telemetry
-   Cloud requests only when selected
-   Encrypted local history

------------------------------------------------------------------------

## 13. Settings

-   Theme
-   Global shortcuts
-   AI provider
-   Default model
-   Temperature
-   Token limits
-   Auto-paste
-   Clipboard behavior
-   Language

------------------------------------------------------------------------

## 14. Technical Architecture

``` text
React UI (Electron/Tauri)
          │
Desktop Background Service
          │
Global Hotkey Manager
          │
Clipboard Manager
          │
Prompt Processing Engine
          │
Context Detection
          │
Template Engine
          │
AI Provider Layer
          │
Ollama / Groq / Gemini / OpenAI
          │
Output Formatter
          │
Replace Selected Text
```

------------------------------------------------------------------------

## 15. Technology Stack

### Desktop

-   Electron or Tauri
-   React
-   TypeScript

### Backend

-   Node.js
-   Fastify

### Storage

-   SQLite

### AI

-   Ollama
-   Groq SDK
-   OpenAI SDK
-   Gemini SDK

------------------------------------------------------------------------

## 16. Roadmap

### v1

-   Prompt enhancement
-   Global hotkeys
-   Ollama support
-   Groq support
-   Prompt history
-   Templates

### v1.5 — Intelligence

-   Real-Time Floating Streaming Preview Window
-   Persona Profiles System (tone, format rules, system prompt injection)
-   Smart History Stack + FTS4 Full-Text Fast Search (Ctrl+Shift+H quick picker)
-   Multi-Turn Conversational Refinement Loop

### v2

-   OCR
-   Voice-to-prompt
-   Browser extension
-   MCP server
-   Plugin SDK
-   Team sharing

------------------------------------------------------------------------

## 17. Success Metrics

-   Enhancement latency under 2 seconds
-   Works across major desktop applications
-   One-keystroke workflow
-   Offline capability
-   Extensible architecture
