// ====================================================
// PromptForge AI — History Store (Zustand)
// ====================================================

import { create } from 'zustand'
import type { HistoryEntry, HistoryFilter, PaginatedResult } from '../../../shared/types'
import { IPC_CHANNELS, HISTORY_PAGE_SIZE } from '../../../shared/constants'

interface HistoryState {
  // Data
  entries: HistoryEntry[]
  total: number
  page: number
  totalPages: number

  // Filters
  filter: HistoryFilter
  setFilter: (filter: Partial<HistoryFilter>) => void
  clearFilters: () => void

  // Actions
  fetchHistory: () => Promise<void>
  setPage: (page: number) => void
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>
  deleteEntries: (ids: string[]) => Promise<void>

  // Selection
  selectedIds: Set<string>
  toggleSelected: (id: string) => void
  clearSelection: () => void

  // Loading
  isLoading: boolean
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Data
  entries: [],
  total: 0,
  page: 1,
  totalPages: 0,

  // Filters
  filter: {},
  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter }, page: 1 }))
    get().fetchHistory()
  },
  clearFilters: () => {
    set({ filter: {}, page: 1 })
    get().fetchHistory()
  },

  // Actions
  fetchHistory: async () => {
    set({ isLoading: true })
    try {
      const result = (await window.api.invoke(IPC_CHANNELS.HISTORY_QUERY, {
        filter: get().filter,
        page: get().page,
        pageSize: HISTORY_PAGE_SIZE
      })) as PaginatedResult<HistoryEntry>

      set({
        entries: result.items,
        total: result.total,
        totalPages: result.totalPages,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to fetch history:', error)
      set({ isLoading: false })
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchHistory()
  },

  toggleFavorite: async (id, isFavorite) => {
    await window.api.invoke(IPC_CHANNELS.HISTORY_FAVORITE, { id, isFavorite })
    // Update local state
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, isFavorite } : e))
    }))
  },

  deleteEntries: async (ids) => {
    await window.api.invoke(IPC_CHANNELS.HISTORY_DELETE, ids)
    get().fetchHistory()
    set({ selectedIds: new Set() })
  },

  // Selection
  selectedIds: new Set(),
  toggleSelected: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedIds: newSet }
    })
  },
  clearSelection: () => set({ selectedIds: new Set() }),

  isLoading: false
}))
