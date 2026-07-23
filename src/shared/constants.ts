// ====================================================
// PromptForge AI — App-wide Constants
// ====================================================

import type { EnhanceMode, EnhanceModeInfo, AppSettings } from './types'

// ----- IPC Channels -----

export const IPC_CHANNELS = {
  // Enhancement
  ENHANCE_REQUEST: 'promptforge:enhance:request',
  ENHANCE_RESULT: 'promptforge:enhance:result',
  ENHANCE_STREAM: 'promptforge:enhance:stream',
  ENHANCE_ERROR: 'promptforge:enhance:error',

  // Preview window (floating streaming preview overlay)
  PREVIEW_TOKEN_CHUNK: 'promptforge:preview:token-chunk',
  PREVIEW_STREAM_DONE: 'promptforge:preview:stream-done',
  PREVIEW_STREAM_ERROR: 'promptforge:preview:stream-error',
  PREVIEW_SOURCE_TEXT: 'promptforge:preview:source-text',
  PREVIEW_ACCEPT: 'promptforge:preview:accept',
  PREVIEW_REJECT: 'promptforge:preview:reject',
  PREVIEW_RERUN: 'promptforge:preview:rerun',

  // Settings
  SETTINGS_GET: 'promptforge:settings:get',
  SETTINGS_SET: 'promptforge:settings:set',
  SETTINGS_GET_ALL: 'promptforge:settings:get-all',
  SETTINGS_CHANGED: 'promptforge:settings:changed',

  // History
  HISTORY_QUERY: 'promptforge:history:query',
  HISTORY_GET: 'promptforge:history:get',
  HISTORY_DELETE: 'promptforge:history:delete',
  HISTORY_FAVORITE: 'promptforge:history:favorite',
  HISTORY_EXPORT: 'promptforge:history:export',
  HISTORY_RECENT: 'promptforge:history:recent',
  HISTORY_CLEAR_ALL: 'promptforge:history:clear-all',
  HISTORY_RECOPY: 'promptforge:history:recopy',
  HISTORY_WINDOW_CLOSE: 'promptforge:history:window-close',
  HISTORY_RESTORE: 'promptforge:history:restore',

  // Templates
  TEMPLATE_LIST: 'promptforge:template:list',
  TEMPLATE_GET: 'promptforge:template:get',
  TEMPLATE_CREATE: 'promptforge:template:create',
  TEMPLATE_UPDATE: 'promptforge:template:update',
  TEMPLATE_DELETE: 'promptforge:template:delete',

  // Providers
  PROVIDER_LIST: 'promptforge:provider:list',
  PROVIDER_TEST: 'promptforge:provider:test',
  PROVIDER_STATUS: 'promptforge:provider:status',
  PROVIDER_MODELS: 'promptforge:provider:models',
  PROVIDER_UPDATE: 'promptforge:provider:update',

  // Hotkeys
  HOTKEY_LIST: 'promptforge:hotkey:list',
  HOTKEY_UPDATE: 'promptforge:hotkey:update',
  HOTKEY_TRIGGERED: 'promptforge:hotkey:triggered',

  // Personas
  PERSONA_LIST: 'promptforge:persona:list',
  PERSONA_GET_DEFAULT: 'promptforge:persona:get-default',
  PERSONA_CREATE: 'promptforge:persona:create',
  PERSONA_UPDATE: 'promptforge:persona:update',
  PERSONA_DELETE: 'promptforge:persona:delete',
  PERSONA_SET_DEFAULT: 'promptforge:persona:set-default',

  // Refinement Loop (multi-turn refinement)
  REFINEMENT_START: 'promptforge:refinement:start',
  REFINEMENT_SEND_INSTRUCTION: 'promptforge:refinement:send-instruction',
  REFINEMENT_TOKEN_CHUNK: 'promptforge:refinement:token-chunk',
  REFINEMENT_DONE: 'promptforge:refinement:done',
  REFINEMENT_ERROR: 'promptforge:refinement:error',
  REFINEMENT_END_SESSION: 'promptforge:refinement:end-session',

  // Window
  WINDOW_TOGGLE: 'promptforge:window:toggle',
  WINDOW_OPEN: 'promptforge:window:open',
  WINDOW_CLOSE: 'promptforge:window:close',

  // App
  APP_VERSION: 'promptforge:app:version',
  APP_QUIT: 'promptforge:app:quit'
} as const

// ----- Enhancement Modes -----

export const ENHANCE_MODES: Record<EnhanceMode, EnhanceModeInfo> = {
  enhance: {
    id: 'enhance',
    label: 'Enhance',
    description: 'Rewrite prompt professionally, improve clarity, add missing context',
    icon: 'Sparkles',
    hotkey: 'Ctrl+Shift+E'
  },
  expand: {
    id: 'expand',
    label: 'Expand',
    description: 'Expand a brief prompt into detailed, structured instructions',
    icon: 'Maximize2',
    hotkey: 'Ctrl+Shift+X'
  },
  compress: {
    id: 'compress',
    label: 'Compress',
    description: 'Reduce verbose prompt to concise version preserving core intent',
    icon: 'Minimize2',
    hotkey: 'Ctrl+Shift+K'
  },
  explain: {
    id: 'explain',
    label: 'Explain',
    description: 'Explain what a prompt does and suggest improvements',
    icon: 'HelpCircle'
  },
  translate: {
    id: 'translate',
    label: 'Translate',
    description: 'Translate prompt to another language while preserving intent',
    icon: 'Languages'
  },
  'grammar-fix': {
    id: 'grammar-fix',
    label: 'Grammar Fix',
    description: 'Fix grammar/spelling without changing meaning or tone',
    icon: 'SpellCheck'
  },
  'convert-prd': {
    id: 'convert-prd',
    label: 'Convert to PRD',
    description: 'Transform rough notes into a structured Product Requirements Document',
    icon: 'FileText'
  },
  'convert-markdown': {
    id: 'convert-markdown',
    label: 'Convert to Markdown',
    description: 'Convert text to well-formatted markdown with headings, lists, code blocks',
    icon: 'Hash'
  },
  'notes-to-prompt': {
    id: 'notes-to-prompt',
    label: 'Notes to Prompt',
    description: 'Convert rough notes into a proper, well-structured AI prompt',
    icon: 'PenTool'
  }
}

// ----- Default Settings -----

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultProvider: 'ollama',
  defaultModel: 'llama3.1',
  temperature: 0.7,
  maxTokens: 2048,
  autoPaste: true,
  clipboardTimeout: 30,
  startWithSystem: false,
  minimizeToTray: true,
  notifications: 'on',
  dataRetentionDays: -1,
  previewWindowEnabled: false,
  refinementSessionTimeoutMinutes: 5
}

// ----- Default Hotkey Bindings -----

export const DEFAULT_HOTKEYS: Record<string, string> = {
  enhance: 'Ctrl+Shift+E',
  expand: 'Ctrl+Shift+X',
  compress: 'Ctrl+Shift+K',
  palette: 'Ctrl+Shift+P',
  explain: 'Ctrl+Shift+/',
  translate: 'Ctrl+Shift+T',
  'grammar-fix': 'Ctrl+Shift+G'
}

// ----- Default Provider Configs -----

export const DEFAULT_PROVIDERS = {
  ollama: {
    name: 'ollama' as const,
    type: 'local' as const,
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.1',
    priority: 100
  },
  groq: {
    name: 'groq' as const,
    type: 'cloud' as const,
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    priority: 90
  },
  openai: {
    name: 'openai' as const,
    type: 'cloud' as const,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    priority: 80
  }
}

// ----- App Constants -----

export const APP_NAME = 'PromptForge AI'
export const APP_TAGLINE = 'Forge Better Prompts. Get Better Results.'
export const COMPANY_NAME = 'PromptForge'
export const COPYRIGHT_NOTICE = 'Copyright © 2026 PromptForge'
export const APP_ID = 'com.promptforge.ai'
export const DB_FILENAME = 'promptforge.db'
export const CONFIG_FILENAME = 'promptforge.config.json'
export const HISTORY_PAGE_SIZE = 20
export const TOAST_DURATION_SUCCESS = 3000
export const TOAST_DURATION_ERROR = 5000
export const HEALTH_CHECK_INTERVAL = 60000
export const MAX_TEMPLATE_CACHE_SIZE = 100
