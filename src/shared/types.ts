// ====================================================
// PromptForge AI — Shared Type Definitions
// ====================================================

// ----- Enhancement Modes -----

export type EnhanceMode =
  | 'enhance'
  | 'expand'
  | 'compress'
  | 'explain'
  | 'translate'
  | 'grammar-fix'
  | 'convert-prd'
  | 'convert-markdown'
  | 'notes-to-prompt'

export interface EnhanceModeInfo {
  id: EnhanceMode
  label: string
  description: string
  icon: string
  hotkey?: string
}

// ----- AI Providers -----

export type ProviderType = 'local' | 'cloud'
export type ProviderName = 'ollama' | 'groq' | 'openai' | 'openrouter' | 'custom'

export interface ProviderConfig {
  id: string
  name: ProviderName | string
  type: ProviderType
  baseUrl: string
  apiKeyEncrypted?: string
  defaultModel: string
  isActive: boolean
  priority: number
  config: ProviderSettings
  createdAt: string
}

export interface ProviderSettings {
  temperature: number
  maxTokens: number
  timeoutMs: number
  retryCount: number
}

export interface ProviderStatus {
  name: string
  status: 'healthy' | 'degraded' | 'offline'
  latencyMs?: number
  lastChecked: string
}

// ----- AI Provider Interface -----

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  stream?: boolean
}

export interface CompletionResult {
  text: string
  tokensUsed: number
  latencyMs: number
  provider: string
  model: string
}

export interface AIProviderInterface {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  enhance(
    input: string,
    systemPrompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResult>
  listModels(): Promise<string[]>
}

// ----- Templates -----

export interface TemplateVariable {
  name: string
  type: 'text' | 'select' | 'number'
  options?: string[]
  default: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  systemPrompt: string
  userPromptTemplate: string
  variables: TemplateVariable[]
  isBuiltin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ----- History -----

export interface HistoryEntry {
  id: string
  originalText: string
  enhancedText: string
  provider: string
  model: string
  templateId?: string
  templateName?: string
  category: string
  tokensUsed: number
  latencyMs: number
  isFavorite: boolean
  sourceApp?: string
  createdAt: string
}

export interface HistoryFilter {
  search?: string
  provider?: string
  category?: string
  isFavorite?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ----- Hotkeys -----

export interface HotkeyBinding {
  id: string
  action: string
  keybinding: string
  isActive: boolean
  createdAt: string
}

// ----- Settings -----

export type ThemeMode = 'dark' | 'light' | 'system'

export interface AppSettings {
  theme: ThemeMode
  defaultProvider: string
  defaultModel: string
  temperature: number
  maxTokens: number
  autoPaste: boolean
  clipboardTimeout: number
  startWithSystem: boolean
  minimizeToTray: boolean
  notifications: 'on' | 'off' | 'errors-only'
  dataRetentionDays: number
}

// ----- Tags -----

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

// ----- IPC Payloads -----

export interface EnhanceRequest {
  text: string
  mode: EnhanceMode
  templateId?: string
  provider?: string
  model?: string
}

export interface EnhanceResult {
  enhanced: string
  provider: string
  model: string
  tokensUsed: number
  latencyMs: number
  historyId: string
}

export interface StreamChunk {
  chunk: string
  done: boolean
}
