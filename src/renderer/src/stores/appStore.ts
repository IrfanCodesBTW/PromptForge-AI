// ====================================================
// PromptForge AI — App Store (Zustand)
// ====================================================

import { create } from 'zustand'
import type { ThemeMode, ProviderStatus } from '../../../shared/types'

interface AppState {
  // Theme
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void

  // Provider status
  providerStatuses: ProviderStatus[]
  setProviderStatuses: (statuses: ProviderStatus[]) => void

  // Active provider
  activeProvider: string
  setActiveProvider: (provider: string) => void

  // Settings cache
  settings: Record<string, string>
  setSetting: (key: string, value: string) => void
  setAllSettings: (settings: Record<string, string>) => void

  // Enhancement status
  isEnhancing: boolean
  setIsEnhancing: (value: boolean) => void
  lastResult: {
    enhanced: string
    provider: string
    model: string
    tokensUsed: number
    latencyMs: number
  } | null
  setLastResult: (result: AppState['lastResult']) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })
    // Apply theme to document
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  },

  // Provider status
  providerStatuses: [],
  setProviderStatuses: (statuses) => set({ providerStatuses: statuses }),

  // Active provider
  activeProvider: 'ollama',
  setActiveProvider: (provider) => set({ activeProvider: provider }),

  // Settings
  settings: {},
  setSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value }
    })),
  setAllSettings: (settings) => set({ settings }),

  // Enhancement status
  isEnhancing: false,
  setIsEnhancing: (value) => set({ isEnhancing: value }),
  lastResult: null,
  setLastResult: (result) => set({ lastResult: result })
}))
