// ====================================================
// PromptForge AI — Smart History Picker App
// ====================================================
// Speed-first quick-search popup (Ctrl+Shift+H). Top-20 results, full
// keyboard navigation, one-keystroke re-copy, no editing. Full CRUD lives
// in the main app's History settings tab instead.

import { useCallback, useEffect, useRef } from 'react'
import { IPC_CHANNELS } from '../../shared/constants'
import type { HistoryEntry } from '../../shared/types'
import { DiffView } from './DiffView'
import { useHistoryPickerStore } from './historyPickerStore'
import { Logo } from '../src/components/ui/Logo'

const DEBOUNCE_MS = 150

export function HistoryPickerApp(): JSX.Element {
  const {
    query,
    entries,
    focusedIndex,
    toast,
    undoState,
    setQuery,
    setFocusedIndex,
    fetchEntries,
    recopy,
    deleteEntry,
    undoDelete,
    clearAll
  } = useHistoryPickerStore()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    void fetchEntries('')
    searchInputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void fetchEntries(query)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, fetchEntries])

  const openAsRefinementBase = useCallback((entry: HistoryEntry) => {
    void (async () => {
      try {
        await window.api.invoke(IPC_CHANNELS.REFINEMENT_START, {
          originalText: entry.originalText,
          currentOutput: entry.enhancedText,
          provider: entry.provider,
          model: entry.model
        })
        await window.api.invoke(IPC_CHANNELS.HISTORY_WINDOW_CLOSE)
        await window.api.invoke(IPC_CHANNELS.WINDOW_OPEN, { window: 'preview' })
      } catch (err) {
        console.error('Failed to start refinement session from history entry:', err)
      }
    })()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(Math.min(focusedIndex + 1, entries.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(Math.max(focusedIndex - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const entry = entries[focusedIndex]
        if (entry) void recopy(entry)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement === searchInputRef.current) return
        e.preventDefault()
        const entry = entries[focusedIndex]
        if (entry) void deleteEntry(entry)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        void window.api.invoke(IPC_CHANNELS.HISTORY_WINDOW_CLOSE)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [entries, focusedIndex, recopy, deleteEntry, setFocusedIndex])

  const highlightMatches = (text: string): (string | JSX.Element)[] => {
    if (!query.trim()) return [text]
    const terms = query.trim().split(/\s+/).filter(Boolean)
    const pattern = new RegExp(
      `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    )
    const parts = text.split(pattern)
    return parts.map((part, i) =>
      terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-primary-highlight text-text-primary rounded-xs">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="w-[560px] h-[480px] flex flex-col rounded-md border border-border shadow-popup overflow-hidden bg-surface relative">
      <div className="p-md border-b border-border flex items-center gap-sm">
        <Logo size={20} />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history…"
          className="flex-1 bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="p-md text-sm text-text-muted">No history entries found.</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`p-md border-b border-border cursor-pointer transition-colors ${
                i === focusedIndex
                  ? 'border-primary-highlight bg-surface-card-hover'
                  : 'hover:bg-surface-card-hover'
              }`}
              onClick={() => setFocusedIndex(i)}
            >
              <div className="flex items-center justify-between mb-xs">
                <span className="text-xs text-text-muted font-mono">
                  {entry.provider} · {new Date(entry.createdAt).toLocaleString()}
                </span>
                <div className="flex gap-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void recopy(entry)
                    }}
                    className="text-xs px-sm py-px rounded-full bg-pill-bg hover:bg-pill-bg-hover cursor-pointer"
                  >
                    Re-copy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openAsRefinementBase(entry)
                    }}
                    className="text-xs px-sm py-px rounded-full bg-pill-bg hover:bg-pill-bg-hover cursor-pointer"
                  >
                    Use as Base
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteEntry(entry)
                    }}
                    className="text-xs px-sm py-px rounded-full bg-pill-bg hover:bg-pill-bg-hover text-error cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-primary line-clamp-2">
                {highlightMatches(entry.enhancedText)}
              </p>
              {i === focusedIndex && (
                <div className="mt-sm">
                  <DiffView originalText={entry.originalText} enhancedText={entry.enhancedText} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <footer className="flex items-center justify-between p-md border-t border-border">
        <button onClick={clearAll} className="text-xs text-error hover:underline cursor-pointer">
          Clear All History
        </button>
        <span className="text-xs text-text-muted">
          ↑/↓ navigate · Enter re-copy · Del remove · Esc close
        </span>
      </footer>

      {toast && (
        <div className="absolute bottom-16 right-4 bg-primary text-white text-xs px-md py-sm rounded-full shadow-raised">
          {toast}
        </div>
      )}

      {undoState && (
        <div className="absolute bottom-16 left-4 bg-surface-elevated border border-border text-xs px-md py-sm rounded-full shadow-raised flex items-center gap-sm">
          <span>Deleted &quot;{undoState.entry.originalText.slice(0, 30)}…&quot;</span>
          <button
            onClick={() => void undoDelete()}
            className="text-primary font-medium cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
