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
      <div className="flex items-center justify-between mb-lg select-none">
        <div>
          <h1 className="text-xl font-medium font-serif text-text-primary">History</h1>
          <p className="text-sm text-text-secondary mt-xs font-sans">
            {total} enhancement{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-sm">
            <span className="text-xs text-text-secondary font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-xs px-4 h-8 bg-[--color-red-bg] text-error font-medium rounded-full text-sm hover:opacity-90 transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none active:scale-98"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-card-hover rounded-full transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Clear selection"
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
            className="absolute left-md top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Search prompts..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-sm pl-10 pr-md py-sm text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
          />
        </div>
        <select
          value={filter.provider || ''}
          onChange={(e) => setFilter({ provider: e.target.value || undefined })}
          className="bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
        >
          <option value="">All Providers</option>
          <option value="ollama">Ollama</option>
          <option value="groq">Groq</option>
          <option value="openai">OpenAI</option>
        </select>
        <button
          onClick={() => setFilter({ isFavorite: filter.isFavorite ? undefined : true })}
          className={`flex items-center gap-xs h-9 px-4 rounded-full text-sm font-medium transition-all duration-[160ms] ease-standard active:scale-98 border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none select-none ${
            filter.isFavorite
              ? 'border-warning bg-warning/10 text-warning'
              : 'border-border bg-pill-bg text-text-primary hover:bg-pill-bg-hover'
          }`}
        >
          <Star size={14} />
          Favorites
        </button>
        {Object.keys(filter).length > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-xs h-9 px-4 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-surface-card-hover transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none select-none"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto space-y-sm">
        {isLoading && <div className="text-center py-xl text-text-muted">Loading...</div>}

        {!isLoading && entries.length === 0 && (
          <div className="text-center py-20 bg-surface-elevated rounded-lg border border-border p-xl shadow-card">
            <Clock size={24} className="mx-auto text-text-secondary mb-md" />
            <p className="text-sm font-medium text-text-primary">No history yet</p>
            <p className="text-xs text-text-secondary mt-xs">
              Enhance some text to see it appear here
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`bg-surface-elevated border transition-all duration-[220ms] ease-standard cursor-pointer rounded-lg p-xl ${
              selectedIds.has(entry.id)
                ? 'border-primary bg-mint-100/10 shadow-raised'
                : 'border-border hover:border-text-secondary hover:shadow-card'
            }`}
            onClick={() => toggleSelected(entry.id)}
          >
            {/* Entry Header */}
            <div className="flex items-center justify-between mb-sm select-none">
              <div className="flex items-center gap-sm">
                <span className="text-xs font-mono font-medium px-2 py-0.5 bg-pill-bg text-text-secondary rounded-full">
                  {entry.provider}/{entry.model}
                </span>
                <span className="text-xs text-text-secondary font-medium capitalize font-sans">
                  {entry.category}
                </span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-xs text-text-secondary flex items-center gap-xs font-sans">
                  <Zap size={12} className="text-primary" />
                  {formatTokens(entry.tokensUsed)} tokens · {formatDuration(entry.latencyMs)}
                </span>
                <span className="text-xs text-text-secondary font-sans">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            </div>

            {/* Original → Enhanced */}
            <div className="grid grid-cols-2 gap-md font-sans">
              <div className="min-w-0">
                <p className="text-xs text-text-secondary mb-xs font-medium uppercase tracking-wider">
                  Original
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {truncate(entry.originalText, 200)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary mb-xs font-medium uppercase tracking-wider">
                  Enhanced
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {truncate(entry.enhancedText, 200)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-sm mt-md pt-sm border-t border-border select-none">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(entry.id, !entry.isFavorite)
                }}
                className={`p-1.5 rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  entry.isFavorite
                    ? 'text-warning hover:text-warning/80 bg-warning/5'
                    : 'text-text-secondary hover:text-warning hover:bg-warning/5'
                }`}
                aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={14} fill={entry.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(entry.enhancedText)
                }}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-card-hover rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label="Copy enhanced text"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntries([entry.id])
                }}
                className="p-1.5 text-text-secondary hover:text-error hover:bg-error/5 rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
                aria-label="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm pt-lg border-t border-border mt-lg select-none">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-card-hover rounded-full transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-text-secondary font-sans font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-card-hover rounded-full transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
