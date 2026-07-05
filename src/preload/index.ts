// ====================================================
// PromptForge AI — Preload Script
// ====================================================
// Exposes a typed API to the renderer via contextBridge.
// The renderer uses `window.api` to communicate with the main process.

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

// Type for the exposed API
export interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  send: (channel: string, ...args: unknown[]) => void
}

// Allowed channels (whitelist for security)
const validInvokeChannels = [
  IPC_CHANNELS.ENHANCE_REQUEST,
  IPC_CHANNELS.SETTINGS_GET,
  IPC_CHANNELS.SETTINGS_SET,
  IPC_CHANNELS.SETTINGS_GET_ALL,
  IPC_CHANNELS.HISTORY_QUERY,
  IPC_CHANNELS.HISTORY_GET,
  IPC_CHANNELS.HISTORY_DELETE,
  IPC_CHANNELS.HISTORY_FAVORITE,
  IPC_CHANNELS.HISTORY_EXPORT,
  IPC_CHANNELS.TEMPLATE_LIST,
  IPC_CHANNELS.TEMPLATE_GET,
  IPC_CHANNELS.TEMPLATE_CREATE,
  IPC_CHANNELS.TEMPLATE_UPDATE,
  IPC_CHANNELS.TEMPLATE_DELETE,
  IPC_CHANNELS.PROVIDER_LIST,
  IPC_CHANNELS.PROVIDER_TEST,
  IPC_CHANNELS.PROVIDER_STATUS,
  IPC_CHANNELS.PROVIDER_MODELS,
  IPC_CHANNELS.HOTKEY_LIST,
  IPC_CHANNELS.HOTKEY_UPDATE,
  IPC_CHANNELS.APP_VERSION,
  IPC_CHANNELS.APP_QUIT
]

const validOnChannels = [
  IPC_CHANNELS.ENHANCE_RESULT,
  IPC_CHANNELS.ENHANCE_STREAM,
  IPC_CHANNELS.ENHANCE_ERROR,
  IPC_CHANNELS.SETTINGS_CHANGED,
  IPC_CHANNELS.PROVIDER_STATUS,
  IPC_CHANNELS.HOTKEY_TRIGGERED,
  IPC_CHANNELS.WINDOW_TOGGLE
]

const api: ElectronAPI = {
  invoke: (channel: string, ...args: unknown[]) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`Invalid invoke channel: ${channel}`)
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (validOnChannels.includes(channel)) {
      const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
      ipcRenderer.on(channel, handler)
      // Return unsubscribe function
      return () => ipcRenderer.removeListener(channel, handler)
    }
    throw new Error(`Invalid on channel: ${channel}`)
  },

  send: (channel: string, ...args: unknown[]) => {
    if (validInvokeChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  }
}

// Expose API to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose API via contextBridge:', error)
  }
} else {
  // @ts-expect-error Fallback for non-isolated context
  window.api = api
}
