// ====================================================
// PromptForge AI — History Picker Store (Zustand)
// ====================================================
// State for the Ctrl+Shift+H quick-search popup window. Separate from the
// main app's useHistoryStore (src/renderer/src/stores/historyStore.ts) —
// this store lives in the standalone history-picker renderer bundle and is
// optimized for speed-first search/navigate/act, not full CRUD/pagination.

import { create } from 'zustand'
import { IPC_CHANNELS } from '../../shared/constants'
import type { HistoryEntry } from '../../shared/types'

interface UndoState {
  entry: HistoryEntry
  timeoutId: number
}

interface HistoryPickerState {
  query: string
  entries: HistoryEntry[]
  focusedIndex: number
  toast: string | null
  undoState: UndoState | null

  setQuery: (query: string) => void
  setFocusedIndex: (index: number) => void
  fetchEntries: (query: string) => Promise<void>
  recopy: (entry: HistoryEntry) => Promise<void>
  deleteEntry: (entry: HistoryEntry) => Promise<void>
  undoDelete: () => Promise<void>
  clearAll: () => Promise<void>
  showToast: (message: string) => void
}

export const useHistoryPickerStore = create<HistoryPickerState>((set, get) => ({
  query: '',
  entries: [],
  focusedIndex: 0,
  toast: null,
  undoState: null,

  setQuery: (query) => set({ query }),

  setFocusedIndex: (index) => set({ focusedIndex: index }),

  fetchEntries: async (query) => {
    const result = (await window.api.invoke(IPC_CHANNELS.HISTORY_RECENT, {
      limit: 20,
      query: query || undefined
    })) as HistoryEntry[]
    set({ entries: result, focusedIndex: 0 })
  },

  showToast: (message) => {
    set({ toast: message })
    window.setTimeout(() => set({ toast: null }), 1500)
  },

  recopy: async (entry) => {
    await window.api.invoke(IPC_CHANNELS.HISTORY_RECOPY, entry.id)
    get().showToast('Copied!')
  },

  deleteEntry: async (entry) => {
    await window.api.invoke(IPC_CHANNELS.HISTORY_DELETE, [entry.id])
    set((state) => ({ entries: state.entries.filter((e) => e.id !== entry.id) }))

    const prevUndo = get().undoState
    if (prevUndo) window.clearTimeout(prevUndo.timeoutId)

    const timeoutId = window.setTimeout(() => {
      set({ undoState: null })
    }, 4000)
    set({ undoState: { entry, timeoutId } })
  },

  undoDelete: async () => {
    const undoState = get().undoState
    if (!undoState) return
    window.clearTimeout(undoState.timeoutId)
    const { entry } = undoState

    await window.api.invoke(IPC_CHANNELS.HISTORY_RESTORE, {
      originalText: entry.originalText,
      enhancedText: entry.enhancedText,
      provider: entry.provider,
      model: entry.model,
      category: entry.category,
      tokensUsed: entry.tokensUsed,
      latencyMs: entry.latencyMs
    })

    set({ undoState: null })
    await get().fetchEntries(get().query)
  },

  clearAll: async () => {
    await window.api.invoke(IPC_CHANNELS.HISTORY_CLEAR_ALL)
    set({ entries: [] })
  }
}))
