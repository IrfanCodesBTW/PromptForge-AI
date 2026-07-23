// ====================================================
// PromptForge AI — History Service
// ====================================================

import type { DatabaseWrapper } from './database'
import { generateId } from '../../shared/utils'
import type { HistoryEntry, HistoryFilter, PaginatedResult } from '../../shared/types'
import { HISTORY_PAGE_SIZE } from '../../shared/constants'

export class HistoryService {
  private db: DatabaseWrapper
  private ftsAvailableCache: boolean | null = null

  constructor(db: DatabaseWrapper) {
    this.db = db
  }

  /**
   * Create a new history entry
   */
  create(data: {
    originalText: string
    enhancedText: string
    provider: string
    model: string
    templateId?: string
    category?: string
    tokensUsed?: number
    latencyMs?: number
    sourceApp?: string
  }): string {
    const id = generateId()

    this.db
      .prepare(
        `INSERT INTO prompt_history (id, original_text, enhanced_text, provider, model, template_id, category, tokens_used, latency_ms, source_app)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.originalText,
        data.enhancedText,
        data.provider,
        data.model,
        data.templateId || null,
        data.category || 'general',
        data.tokensUsed || 0,
        data.latencyMs || 0,
        data.sourceApp || null
      )

    this.syncFtsInsert(id, data.originalText, data.enhancedText)

    return id
  }

  /**
   * Get a single history entry by ID
   */
  getById(id: string): HistoryEntry | null {
    const row = this.db
      .prepare(
        `SELECT ph.*, t.name AS template_name
         FROM prompt_history ph
         LEFT JOIN templates t ON ph.template_id = t.id
         WHERE ph.id = ?`
      )
      .get(id) as HistoryRow | undefined

    return row ? this.mapRow(row) : null
  }

  /**
   * Query history with filters and pagination.
   * The `search` filter uses the prompt_history_fts FTS4 index when
   * available (falls back to LIKE if the FTS table doesn't exist yet,
   * e.g. pre-migration or in older test fixtures).
   */
  query(
    filter: HistoryFilter,
    page: number = 1,
    pageSize: number = HISTORY_PAGE_SIZE
  ): PaginatedResult<HistoryEntry> {
    const conditions: string[] = []
    const params: unknown[] = []
    let useFtsJoin = false

    // Build WHERE clause from filters
    if (filter.search) {
      if (this.ftsAvailable()) {
        useFtsJoin = true
        conditions.push('prompt_history_fts MATCH ?')
        params.push(this.sanitizeFtsQuery(filter.search))
      } else {
        conditions.push(`(ph.original_text LIKE ? OR ph.enhanced_text LIKE ?)`)
        const searchParam = `%${filter.search}%`
        params.push(searchParam, searchParam)
      }
    }

    if (filter.provider) {
      conditions.push('ph.provider = ?')
      params.push(filter.provider)
    }

    if (filter.category) {
      conditions.push('ph.category = ?')
      params.push(filter.category)
    }

    if (filter.isFavorite !== undefined) {
      conditions.push('ph.is_favorite = ?')
      params.push(filter.isFavorite ? 1 : 0)
    }

    if (filter.dateFrom) {
      conditions.push('ph.created_at >= ?')
      params.push(filter.dateFrom)
    }

    if (filter.dateTo) {
      conditions.push('ph.created_at <= ?')
      params.push(filter.dateTo)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const ftsJoinClause = useFtsJoin
      ? 'JOIN prompt_history_fts ON prompt_history_fts.docid = ph.rowid'
      : ''

    // Count total
    const countRow = this.db
      .prepare(`SELECT COUNT(*) as total FROM prompt_history ph ${ftsJoinClause} ${whereClause}`)
      .get(...params) as { total: number }

    const total = countRow.total
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize

    // Fetch paginated results
    const rows = this.db
      .prepare(
        `SELECT ph.*, t.name AS template_name
         FROM prompt_history ph
         ${ftsJoinClause}
         LEFT JOIN templates t ON ph.template_id = t.id
         ${whereClause}
         ORDER BY ph.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as HistoryRow[]

    return {
      items: rows.map((row) => this.mapRow(row)),
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * Fast top-N history lookup for the Ctrl+Shift+H quick-search popup.
   * Uses FTS4 MATCH + a simple match-count ranking heuristic (FTS4 has no
   * native bm25() function) when a query is provided; falls back to
   * ORDER BY created_at DESC LIMIT ? when query is omitted or FTS is
   * unavailable.
   */
  getRecentHistory(limit: number, query?: string): HistoryEntry[] {
    if (query && query.trim().length > 0 && this.ftsAvailable()) {
      const rows = this.db
        .prepare(
          `SELECT ph.*, t.name AS template_name,
                  (LENGTH(ph.original_text) + LENGTH(ph.enhanced_text)
                   - LENGTH(REPLACE(LOWER(ph.original_text || ' ' || ph.enhanced_text), LOWER(?), ''))) AS match_score
           FROM prompt_history ph
           JOIN prompt_history_fts ON prompt_history_fts.docid = ph.rowid
           LEFT JOIN templates t ON ph.template_id = t.id
           WHERE prompt_history_fts MATCH ?
           ORDER BY match_score DESC, ph.created_at DESC
           LIMIT ?`
        )
        .all(query.trim(), this.sanitizeFtsQuery(query), limit) as (HistoryRow & {
        match_score: number
      })[]
      return rows.map((row) => this.mapRow(row))
    }

    const rows = this.db
      .prepare(
        `SELECT ph.*, t.name AS template_name
         FROM prompt_history ph
         LEFT JOIN templates t ON ph.template_id = t.id
         ORDER BY ph.created_at DESC, ph.rowid DESC
         LIMIT ?`
      )
      .all(limit) as HistoryRow[]
    return rows.map((row) => this.mapRow(row))
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string, isFavorite: boolean): void {
    this.db
      .prepare('UPDATE prompt_history SET is_favorite = ? WHERE id = ?')
      .run(isFavorite ? 1 : 0, id)
  }

  /**
   * Delete history entries by IDs
   */
  deleteByIds(ids: string[]): void {
    if (ids.length === 0) return
    const placeholders = ids.map(() => '?').join(', ')

    if (this.ftsAvailable()) {
      const rowIds = this.db
        .prepare(`SELECT rowid FROM prompt_history WHERE id IN (${placeholders})`)
        .all(...ids) as { rowid: number }[]
      for (const { rowid } of rowIds) {
        this.db.prepare('DELETE FROM prompt_history_fts WHERE docid = ?').run(rowid)
      }
    }

    this.db.prepare(`DELETE FROM prompt_history WHERE id IN (${placeholders})`).run(...ids)
  }

  /**
   * Delete all history
   */
  deleteAll(): void {
    if (this.ftsAvailable()) {
      this.db.prepare('DELETE FROM prompt_history_fts').run()
    }
    this.db.prepare('DELETE FROM prompt_history').run()
  }

  /**
   * Get history statistics
   */
  getStats(): {
    totalEnhancements: number
    totalTokens: number
    avgLatency: number
    favoriteCount: number
  } {
    const row = this.db
      .prepare(
        `SELECT
           COUNT(*) as totalEnhancements,
           COALESCE(SUM(tokens_used), 0) as totalTokens,
           COALESCE(ROUND(AVG(latency_ms)), 0) as avgLatency,
           COALESCE(SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END), 0) as favoriteCount
         FROM prompt_history`
      )
      .get() as {
      totalEnhancements: number
      totalTokens: number
      avgLatency: number
      favoriteCount: number
    }

    return row
  }

  /**
   * Map a database row to a HistoryEntry
   */
  private mapRow(row: HistoryRow): HistoryEntry {
    return {
      id: row.id,
      originalText: row.original_text,
      enhancedText: row.enhanced_text,
      provider: row.provider,
      model: row.model,
      templateId: row.template_id || undefined,
      templateName: row.template_name || undefined,
      category: row.category,
      tokensUsed: row.tokens_used,
      latencyMs: row.latency_ms,
      isFavorite: row.is_favorite === 1,
      sourceApp: row.source_app || undefined,
      createdAt: row.created_at
    }
  }

  /**
   * Insert a new row into prompt_history_fts, keyed by the just-created
   * prompt_history row's rowid. Application-layer FTS sync — see the note
   * in migrations/004_history_fts4.sql for why DB triggers aren't used.
   * No-ops silently if the FTS table doesn't exist (e.g. pre-migration).
   */
  private syncFtsInsert(id: string, originalText: string, enhancedText: string): void {
    if (!this.ftsAvailable()) return
    try {
      const row = this.db.prepare('SELECT rowid FROM prompt_history WHERE id = ?').get(id) as
        { rowid: number } | undefined
      if (row) {
        this.db
          .prepare(
            'INSERT INTO prompt_history_fts (docid, original_text, enhanced_text) VALUES (?, ?, ?)'
          )
          .run(row.rowid, originalText, enhancedText)
      }
    } catch (error) {
      console.warn('[History] Failed to sync FTS index on insert:', error)
    }
  }

  /**
   * Whether the prompt_history_fts virtual table exists in this database.
   * Cached after first check since the schema doesn't change at runtime.
   */
  private ftsAvailable(): boolean {
    if (this.ftsAvailableCache !== null) return this.ftsAvailableCache
    try {
      this.db.prepare('SELECT 1 FROM prompt_history_fts LIMIT 1').get()
      this.ftsAvailableCache = true
    } catch {
      this.ftsAvailableCache = false
    }
    return this.ftsAvailableCache
  }

  /**
   * Sanitize a raw user search string for safe use in an FTS4 MATCH query.
   * FTS query syntax treats certain characters (quotes, hyphens at word
   * start, etc.) specially; wrapping each token in double quotes forces a
   * literal phrase/token match and avoids FTS query syntax errors on
   * arbitrary user input.
   */
  private sanitizeFtsQuery(raw: string): string {
    const tokens = raw
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => `"${t.replace(/"/g, '')}"`)
    return tokens.join(' ')
  }
}

// Internal row type matching SQLite columns
interface HistoryRow {
  id: string
  original_text: string
  enhanced_text: string
  provider: string
  model: string
  template_id: string | null
  template_name: string | null
  category: string
  tokens_used: number
  latency_ms: number
  is_favorite: number
  source_app: string | null
  created_at: string
}
