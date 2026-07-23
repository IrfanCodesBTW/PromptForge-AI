// ====================================================
// PromptForge AI — HistoryService FTS4 Query Logic Unit Tests
// ====================================================
// Focused unit tests for the query-building logic in HistoryService,
// isolated from the full DB integration suite (tests/integration/db.test.ts
// covers the end-to-end migration + real sql.js behavior).

import { describe, it, expect, vi } from 'vitest'
import { HistoryService } from '../../src/services/db/history'
import type { DatabaseWrapper } from '../../src/services/db/database'

function buildMockDb(options: {
  ftsTableExists: boolean
  rows?: unknown[]
  countRow?: { total: number }
}): { db: DatabaseWrapper; preparedSql: string[] } {
  const preparedSql: string[] = []

  const db = {
    prepare: vi.fn().mockImplementation((sql: string) => {
      preparedSql.push(sql)
      return {
        get: vi.fn().mockImplementation((...args: unknown[]) => {
          if (sql.includes('FROM prompt_history_fts LIMIT 1')) {
            if (!options.ftsTableExists) {
              throw new Error('no such table: prompt_history_fts')
            }
            return {}
          }
          if (sql.includes('SELECT COUNT(*)')) {
            return options.countRow ?? { total: 0 }
          }
          if (sql.includes('SELECT rowid FROM prompt_history WHERE id =')) {
            return { rowid: 1 }
          }
          void args
          return undefined
        }),
        all: vi.fn().mockReturnValue(options.rows ?? []),
        run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
      }
    }),
    exec: vi.fn(),
    pragma: vi.fn(),
    transaction: vi.fn(),
    save: vi.fn(),
    close: vi.fn(),
    raw: {} as unknown
  } as unknown as DatabaseWrapper

  return { db, preparedSql }
}

describe('HistoryService FTS4 query logic', () => {
  it('should use an FTS MATCH-joined query when the FTS table exists and a search filter is provided', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: true, countRow: { total: 0 } })
    const service = new HistoryService(db)

    service.query({ search: 'quantum computing' }, 1, 10)

    const countQuery = preparedSql.find((sql) => sql.includes('SELECT COUNT(*)'))
    expect(countQuery).toContain('JOIN prompt_history_fts')
    expect(countQuery).toContain('prompt_history_fts MATCH ?')
  })

  it('should fall back to LIKE-based search when the FTS table is unavailable', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: false, countRow: { total: 0 } })
    const service = new HistoryService(db)

    service.query({ search: 'quantum computing' }, 1, 10)

    const countQuery = preparedSql.find((sql) => sql.includes('SELECT COUNT(*)'))
    expect(countQuery).not.toContain('JOIN prompt_history_fts')

    const listQuery = preparedSql.find(
      (sql) => sql.includes('SELECT ph.*') && sql.includes('LIMIT ? OFFSET ?')
    )
    expect(listQuery).toContain('LIKE ?')
  })

  it('should not add a search condition at all when no search filter is provided', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: true, countRow: { total: 0 } })
    const service = new HistoryService(db)

    service.query({ provider: 'ollama' }, 1, 10)

    const countQuery = preparedSql.find((sql) => sql.includes('SELECT COUNT(*)'))
    expect(countQuery).not.toContain('MATCH')
    expect(countQuery).not.toContain('LIKE')
    expect(countQuery).toContain('ph.provider = ?')
  })

  it('getRecentHistory() should use FTS MATCH + match-score ranking when a query is provided', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: true, rows: [] })
    const service = new HistoryService(db)

    service.getRecentHistory(20, 'sourdough bread')

    const searchQuery = preparedSql.find((sql) => sql.includes('prompt_history_fts MATCH'))
    expect(searchQuery).toBeDefined()
    expect(searchQuery).toContain('match_score')
    expect(searchQuery).toContain('ORDER BY match_score DESC')
  })

  it('getRecentHistory() should fall back to recency ordering when no query is provided', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: true, rows: [] })
    const service = new HistoryService(db)

    service.getRecentHistory(20)

    const recencyQuery = preparedSql.find(
      (sql) => sql.includes('ORDER BY ph.created_at DESC') && !sql.includes('MATCH')
    )
    expect(recencyQuery).toBeDefined()
  })

  it('getRecentHistory() should fall back to recency ordering when FTS is unavailable, even with a query', () => {
    const { db, preparedSql } = buildMockDb({ ftsTableExists: false, rows: [] })
    const service = new HistoryService(db)

    service.getRecentHistory(20, 'some query')

    const matchQuery = preparedSql.find((sql) => sql.includes('MATCH'))
    expect(matchQuery).toBeUndefined()
  })

  it('should sanitize multi-word search queries into quoted FTS tokens', () => {
    const allSpy = vi.fn().mockReturnValue([])
    const db = {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        get: vi.fn().mockImplementation(() => {
          if (sql.includes('FROM prompt_history_fts LIMIT 1')) return {}
          return undefined
        }),
        all: allSpy,
        run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
      })),
      exec: vi.fn(),
      pragma: vi.fn(),
      transaction: vi.fn(),
      save: vi.fn(),
      close: vi.fn(),
      raw: {} as unknown
    } as unknown as DatabaseWrapper

    const service = new HistoryService(db)
    service.getRecentHistory(5, 'hello world')

    // The MATCH parameter (2nd positional arg to .all()) should be the
    // sanitized, quoted-token form, not the raw multi-word string.
    const callArgs = allSpy.mock.calls[0]
    expect(callArgs[1]).toBe('"hello" "world"')
  })
})
