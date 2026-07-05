// ====================================================
// PromptForge AI — History Service
// ====================================================

import type { DatabaseWrapper } from './database'
import { generateId } from '../../shared/utils'
import type { HistoryEntry, HistoryFilter, PaginatedResult } from '../../shared/types'
import { HISTORY_PAGE_SIZE } from '../../shared/constants'

export class HistoryService {
  private db: DatabaseWrapper

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
   * Query history with filters and pagination
   */
  query(
    filter: HistoryFilter,
    page: number = 1,
    pageSize: number = HISTORY_PAGE_SIZE
  ): PaginatedResult<HistoryEntry> {
    const conditions: string[] = []
    const params: unknown[] = []

    // Build WHERE clause from filters
    if (filter.search) {
      // Use LIKE for text search
      conditions.push(
        `(ph.original_text LIKE ? OR ph.enhanced_text LIKE ?)`
      )
      const searchParam = `%${filter.search}%`
      params.push(searchParam, searchParam)
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

    // Count total
    const countRow = this.db
      .prepare(`SELECT COUNT(*) as total FROM prompt_history ph ${whereClause}`)
      .get(...params) as { total: number }

    const total = countRow.total
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize

    // Fetch paginated results
    const rows = this.db
      .prepare(
        `SELECT ph.*, t.name AS template_name
         FROM prompt_history ph
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
    const placeholders = ids.map(() => '?').join(', ')
    this.db.prepare(`DELETE FROM prompt_history WHERE id IN (${placeholders})`).run(...ids)
  }

  /**
   * Delete all history
   */
  deleteAll(): void {
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
