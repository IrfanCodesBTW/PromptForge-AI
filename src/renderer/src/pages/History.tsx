// ====================================================
// PromptForge AI — History Page
// ====================================================

import { useEffect, useCallback } from 'react'
import {
  Search,
  Star,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Filter,
  X
} from 'lucide-react'
import { useHistoryStore } from '../stores/historyStore'
import { showToast } from '../components/ui/Toast'
import { formatDate, formatDuration, formatTokens, truncate } from '../../../shared/utils'
import { debounce } from '../../../shared/utils'

export function History(): JSX.Element {
  const {
    entries,
    total,
    page,
    totalPages,
    filter,
    isLoading,
    selectedIds,
    fetchHistory,
    setFilter,
    clearFilters,
    setPage,
    toggleFavorite,
    deleteEntries,
    toggleSelected,
    clearSelection
  } = useHistoryStore()

  useEffect(() => {
    fetchHistory()
  }, [])

  const debouncedSearch = useCallback(
    debounce((search: string) => {
      setFilter({ search: search || undefined })
    }, 300),
    []
  )

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    showToast({ type: 'success', title: 'Copied to clipboard' })
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (confirm(`Delete ${selectedIds.size} selected entries?`)) {
      await deleteEntries(Array.from(selectedIds))
      showToast({ type: 'success', title: `${selectedIds.size} entries deleted` })
    }
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">History</h1>
          <p className="text-sm text-text-secondary mt-xs">
            {total} enhancement{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-sm">
            <span className="text-xs text-text-muted">{selectedIds.size} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-xs px-md py-xs bg-error/10 text-error rounded-md text-sm hover:bg-error/20 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-sm mb-lg">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-md top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search prompts..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-md pl-10 pr-md py-sm text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filter.provider || ''}
          onChange={(e) => setFilter({ provider: e.target.value || undefined })}
          className="bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
        >
          <option value="">All Providers</option>
          <option value="ollama">Ollama</option>
          <option value="groq">Groq</option>
          <option value="openai">OpenAI</option>
        </select>
        <button
          onClick={() => setFilter({ isFavorite: filter.isFavorite ? undefined : true })}
          className={`flex items-center gap-xs px-md py-sm rounded-md text-sm transition-colors border ${
            filter.isFavorite
              ? 'border-warning bg-warning/10 text-warning'
              : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <Star size={14} />
          Favorites
        </button>
        {Object.keys(filter).length > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-xs px-md py-sm text-sm text-text-muted hover:text-text-primary"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto space-y-sm">
        {isLoading && (
          <div className="text-center py-xl text-text-muted">Loading...</div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="text-center py-3xl">
            <Clock size={48} className="mx-auto text-text-muted mb-md" />
            <p className="text-text-secondary">No history yet</p>
            <p className="text-xs text-text-muted mt-xs">
              Enhance some text to see it appear here
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`bg-surface border rounded-lg p-lg transition-colors cursor-pointer ${
              selectedIds.has(entry.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-text-muted'
            }`}
            onClick={() => toggleSelected(entry.id)}
          >
            {/* Entry Header */}
            <div className="flex items-center justify-between mb-sm">
              <div className="flex items-center gap-sm">
                <span className="text-xs px-sm py-xs bg-surface-elevated rounded text-text-secondary font-mono">
                  {entry.provider}/{entry.model}
                </span>
                <span className="text-xs text-text-muted">{entry.category}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-xs text-text-muted flex items-center gap-xs">
                  <Zap size={12} />
                  {formatTokens(entry.tokensUsed)} tokens · {formatDuration(entry.latencyMs)}
                </span>
                <span className="text-xs text-text-muted">{formatDate(entry.createdAt)}</span>
              </div>
            </div>

            {/* Original → Enhanced */}
            <div className="grid grid-cols-2 gap-md">
              <div className="min-w-0">
                <p className="text-xs text-text-muted mb-xs font-medium">Original</p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {truncate(entry.originalText, 200)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-muted mb-xs font-medium">Enhanced</p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {truncate(entry.enhancedText, 200)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-sm mt-md pt-sm border-t border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(entry.id, !entry.isFavorite)
                }}
                className={`p-xs rounded transition-colors ${
                  entry.isFavorite
                    ? 'text-warning hover:text-warning/80'
                    : 'text-text-muted hover:text-warning'
                }`}
              >
                <Star size={14} fill={entry.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(entry.enhancedText)
                }}
                className="p-xs text-text-muted hover:text-text-primary rounded transition-colors"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntries([entry.id])
                }}
                className="p-xs text-text-muted hover:text-error rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm pt-lg border-t border-border mt-lg">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="p-xs text-text-muted hover:text-text-primary disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="p-xs text-text-muted hover:text-text-primary disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
