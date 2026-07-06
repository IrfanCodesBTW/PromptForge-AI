// ====================================================
// PromptForge AI — IPC Channel Definitions
// ====================================================
// Type-safe channel contract between main and renderer processes.

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
  AppSettings
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
  [IPC_CHANNELS.PROVIDER_MODELS]: (provider: string) => Promise<string[]>

  // Hotkeys
  [IPC_CHANNELS.HOTKEY_LIST]: () => Promise<HotkeyBinding[]>
  [IPC_CHANNELS.HOTKEY_UPDATE]: (binding: HotkeyBinding) => Promise<void>

  // App
  [IPC_CHANNELS.APP_VERSION]: () => Promise<string>
  [IPC_CHANNELS.APP_QUIT]: () => Promise<void>
}

/**
 * IPC Event signatures for webContents.send / ipcRenderer.on
 * Main process pushes these to renderer
 */
export interface IpcRendererEvents {
  [IPC_CHANNELS.ENHANCE_RESULT]: EnhanceResult
  [IPC_CHANNELS.ENHANCE_STREAM]: StreamChunk
  [IPC_CHANNELS.ENHANCE_ERROR]: { code: string; message: string }
  [IPC_CHANNELS.SETTINGS_CHANGED]: { key: string; value: string }
  [IPC_CHANNELS.PROVIDER_STATUS]: ProviderStatus[]
  [IPC_CHANNELS.HOTKEY_TRIGGERED]: { action: string }
  [IPC_CHANNELS.WINDOW_TOGGLE]: { window: string; visible: boolean }
}
