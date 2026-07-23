// ====================================================
// PromptForge AI — IPC Channel Definitions
// ====================================================
// Type-safe channel contract between main and renderer processes.
// Keep in sync with: src/main/ipc/handlers.ts and src/preload/index.ts

import { IPC_CHANNELS } from '@shared/constants'
import type {
  EnhanceRequest,
  EnhanceResult,
  StreamChunk,
  HistoryEntry,
  HistoryFilter,
  PaginatedResult,
  Template,
  ProviderConfig,
  ProviderStatus,
  HotkeyBinding,
  AppSettings,
  Persona,
  RefinementStartPayload,
  RefinementStartResult,
  RefinementInstructionPayload,
  RefinementTokenChunkPayload,
  RefinementDonePayload,
  RefinementErrorPayload,
  PreviewTokenChunkPayload,
  PreviewStreamDonePayload,
  PreviewStreamErrorPayload,
  PreviewSourceTextPayload
} from '@shared/types'

/**
 * IPC Handler signatures for ipcMain.handle
 * Renderer calls these via ipcRenderer.invoke
 */
export interface IpcMainHandlers {
  // Enhancement
  [IPC_CHANNELS.ENHANCE_REQUEST]: (request: EnhanceRequest) => Promise<EnhanceResult>

  // Settings
  [IPC_CHANNELS.SETTINGS_GET]: (key: string) => Promise<string | null>
  [IPC_CHANNELS.SETTINGS_SET]: (data: { key: string; value: string }) => Promise<void>
  [IPC_CHANNELS.SETTINGS_GET_ALL]: () => Promise<AppSettings>

  // History
  [IPC_CHANNELS.HISTORY_QUERY]: (data: {
    filter: HistoryFilter
    page: number
    pageSize: number
  }) => Promise<PaginatedResult<HistoryEntry>>
  [IPC_CHANNELS.HISTORY_GET]: (id: string) => Promise<HistoryEntry | null>
  [IPC_CHANNELS.HISTORY_DELETE]: (ids: string[]) => Promise<void>
  [IPC_CHANNELS.HISTORY_FAVORITE]: (data: { id: string; isFavorite: boolean }) => Promise<void>
  [IPC_CHANNELS.HISTORY_RECENT]: (data: { limit?: number; query?: string }) => Promise<HistoryEntry[]>
  [IPC_CHANNELS.HISTORY_CLEAR_ALL]: () => Promise<void>
  [IPC_CHANNELS.HISTORY_RECOPY]: (id: string) => Promise<boolean>
  [IPC_CHANNELS.HISTORY_WINDOW_CLOSE]: () => Promise<void>
  [IPC_CHANNELS.HISTORY_RESTORE]: (data: {
    originalText: string
    enhancedText: string
    provider: string
    model: string
    category?: string
    tokensUsed?: number
    latencyMs?: number
  }) => Promise<string>

  // Templates
  [IPC_CHANNELS.TEMPLATE_LIST]: (category?: string) => Promise<Template[]>
  [IPC_CHANNELS.TEMPLATE_GET]: (id: string) => Promise<Template | null>
  [IPC_CHANNELS.TEMPLATE_CREATE]: (
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Template>
  [IPC_CHANNELS.TEMPLATE_UPDATE]: (template: Partial<Template> & { id: string }) => Promise<void>
  [IPC_CHANNELS.TEMPLATE_DELETE]: (id: string) => Promise<void>

  // Providers
  [IPC_CHANNELS.PROVIDER_LIST]: () => Promise<ProviderConfig[]>
  [IPC_CHANNELS.PROVIDER_TEST]: (data: {
    provider: string
    apiKey?: string
  }) => Promise<ProviderStatus>
  [IPC_CHANNELS.PROVIDER_STATUS]: () => Promise<ProviderStatus[]>
  [IPC_CHANNELS.PROVIDER_MODELS]: (data: { provider: string }) => Promise<string[]>
  [IPC_CHANNELS.PROVIDER_UPDATE]: (data: {
    provider: string
    apiKey?: string
    model?: string
  }) => Promise<{ success: boolean }>

  // Hotkeys
  [IPC_CHANNELS.HOTKEY_LIST]: () => Promise<HotkeyBinding[]>
  [IPC_CHANNELS.HOTKEY_UPDATE]: (binding: HotkeyBinding) => Promise<void>

  // Personas
  [IPC_CHANNELS.PERSONA_LIST]: () => Promise<Persona[]>
  [IPC_CHANNELS.PERSONA_GET_DEFAULT]: () => Promise<Persona | null>
  [IPC_CHANNELS.PERSONA_CREATE]: (data: {
    name: string
    description?: string
    tone: string
    formatRules?: string
    systemPromptInjection: string
    isDefault?: boolean
  }) => Promise<Persona>
  [IPC_CHANNELS.PERSONA_UPDATE]: (data: { id: string } & Partial<Persona>) => Promise<void>
  [IPC_CHANNELS.PERSONA_DELETE]: (id: string) => Promise<void>
  [IPC_CHANNELS.PERSONA_SET_DEFAULT]: (id: string) => Promise<void>

  // Preview Window Actions
  [IPC_CHANNELS.PREVIEW_ACCEPT]: () => Promise<void>
  [IPC_CHANNELS.PREVIEW_REJECT]: () => Promise<void>
  [IPC_CHANNELS.PREVIEW_RERUN]: () => Promise<void>

  // Refinement Loop
  [IPC_CHANNELS.REFINEMENT_START]: (data: RefinementStartPayload) => Promise<RefinementStartResult>
  [IPC_CHANNELS.REFINEMENT_SEND_INSTRUCTION]: (
    data: RefinementInstructionPayload
  ) => Promise<{ success: boolean }>
  [IPC_CHANNELS.REFINEMENT_END_SESSION]: (data: { sessionId: string }) => Promise<{ success: boolean }>

  // Window
  [IPC_CHANNELS.WINDOW_TOGGLE]: (data: { action: 'minimize' | 'maximize' | 'close' }) => Promise<void>
  [IPC_CHANNELS.WINDOW_OPEN]: (data: { window: 'preview' | 'history' }) => Promise<void>

  // App
  [IPC_CHANNELS.APP_VERSION]: () => Promise<string>
  [IPC_CHANNELS.APP_QUIT]: () => Promise<void>
}

/**
 * IPC Event signatures for webContents.send / ipcRenderer.on
 * Main process pushes these to renderer
 */
export interface IpcRendererEvents {
  // Enhancement
  [IPC_CHANNELS.ENHANCE_RESULT]: EnhanceResult
  [IPC_CHANNELS.ENHANCE_STREAM]: StreamChunk
  [IPC_CHANNELS.ENHANCE_ERROR]: { code: string; message: string }

  // Settings
  [IPC_CHANNELS.SETTINGS_CHANGED]: { key: string; value: string }

  // Provider health
  [IPC_CHANNELS.PROVIDER_STATUS]: ProviderStatus[]

  // Hotkeys
  [IPC_CHANNELS.HOTKEY_TRIGGERED]: { action: string }

  // Window
  [IPC_CHANNELS.WINDOW_TOGGLE]: { window: string; visible: boolean }

  // Preview window streaming (main → preview renderer)
  [IPC_CHANNELS.PREVIEW_SOURCE_TEXT]: PreviewSourceTextPayload
  [IPC_CHANNELS.PREVIEW_TOKEN_CHUNK]: PreviewTokenChunkPayload
  [IPC_CHANNELS.PREVIEW_STREAM_DONE]: PreviewStreamDonePayload
  [IPC_CHANNELS.PREVIEW_STREAM_ERROR]: PreviewStreamErrorPayload

  // Refinement loop streaming (main → preview renderer)
  [IPC_CHANNELS.REFINEMENT_TOKEN_CHUNK]: RefinementTokenChunkPayload
  [IPC_CHANNELS.REFINEMENT_DONE]: RefinementDonePayload
  [IPC_CHANNELS.REFINEMENT_ERROR]: RefinementErrorPayload
}

