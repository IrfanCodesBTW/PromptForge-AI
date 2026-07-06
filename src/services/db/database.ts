// ====================================================
// PromptForge AI — Database Connection & Migrations
// ====================================================
// Uses sql.js (WASM SQLite) with a compatibility wrapper
// that mimics the better-sqlite3 API.

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { DB_FILENAME } from '../../shared/constants'

let dbInstance: DatabaseWrapper | null = null
let sqlJsDb: SqlJsDatabase | null = null
let dbPath: string = ''

// ====================================================
// DatabaseWrapper — better-sqlite3 compatible API
// ====================================================

export class DatabaseWrapper {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  /**
   * Execute raw SQL (DDL, multi-statement)
   */
  exec(sql: string): void {
    this.db.run(sql)
  }

  /**
   * Create a prepared statement with better-sqlite3-like API
   */
  prepare(sql: string): PreparedStatement {
    return new PreparedStatement(this.db, sql)
  }

  /**
   * Set a pragma value
   */
  pragma(pragma: string): unknown {
    try {
      const results = this.db.exec(`PRAGMA ${pragma}`)
      if (results.length > 0 && results[0].values.length > 0) {
        return results[0].values[0][0]
      }
    } catch {
      // Some pragmas may not be supported in WASM build
    }
    return undefined
  }

  /**
   * Create a transaction wrapper
   */
  transaction<T>(fn: () => T): () => T {
    return () => {
      this.db.run('BEGIN TRANSACTION')
      try {
        const result = fn()
        this.db.run('COMMIT')
        return result
      } catch (error) {
        this.db.run('ROLLBACK')
        throw error
      }
    }
  }

  /**
   * Save the database to disk
   */
  save(): void {
    if (dbPath) {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      writeFileSync(dbPath, buffer)
    }
  }

  /**
   * Close the database (saves first)
   */
  close(): void {
    this.save()
    this.db.close()
  }

  /** Get the underlying sql.js database */
  get raw(): SqlJsDatabase {
    return this.db
  }
}

// ====================================================
// PreparedStatement — mimics better-sqlite3's Statement
// ====================================================

class PreparedStatement {
  private db: SqlJsDatabase
  private sql: string

  constructor(db: SqlJsDatabase, sql: string) {
    this.db = db
    this.sql = sql
  }

  /**
   * Execute and return first row as object (like .get())
   */
  get(...params: unknown[]): Record<string, unknown> | undefined {
    try {
      const stmt = this.db.prepare(this.sql)
      stmt.bind(this.normalizeParams(params))
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row as Record<string, unknown>
      }
      stmt.free()
      return undefined
    } catch (error) {
      console.error('[DB] get() error:', error, 'SQL:', this.sql)
      return undefined
    }
  }

  /**
   * Execute and return all rows as objects (like .all())
   */
  all(...params: unknown[]): Record<string, unknown>[] {
    try {
      const stmt = this.db.prepare(this.sql)
      stmt.bind(this.normalizeParams(params))
      const rows: Record<string, unknown>[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Record<string, unknown>)
      }
      stmt.free()
      return rows
    } catch (error) {
      console.error('[DB] all() error:', error, 'SQL:', this.sql)
      return []
    }
  }

  /**
   * Execute a write statement (INSERT, UPDATE, DELETE) (like .run())
   */
  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    try {
      this.db.run(this.sql, this.normalizeParams(params))
      const changesResult = this.db.exec('SELECT changes() as c')
      const rowidResult = this.db.exec('SELECT last_insert_rowid() as r')
      return {
        changes: (changesResult[0]?.values[0]?.[0] as number) || 0,
        lastInsertRowid: (rowidResult[0]?.values[0]?.[0] as number) || 0
      }
    } catch (error) {
      console.error('[DB] run() error:', error, 'SQL:', this.sql)
      return { changes: 0, lastInsertRowid: 0 }
    }
  }

  /**
   * Normalize parameters for sql.js binding
   * sql.js expects a flat array or an object, not spread args
   */
  private normalizeParams(params: unknown[]): unknown[] {
    // If first arg is an array, use it directly
    if (params.length === 1 && Array.isArray(params[0])) {
      return params[0]
    }
    // Flatten any nested params
    return params.flat().map((p) => {
      if (p === undefined) return null
      if (typeof p === 'boolean') return p ? 1 : 0
      return p
    })
  }
}

// ====================================================
// Public API
// ====================================================

/**
 * Initialize the SQLite database.
 * Creates the DB file if it doesn't exist, runs migrations.
 */
export async function initDatabaseAsync(): Promise<DatabaseWrapper> {
  if (dbInstance) return dbInstance

  const SQL = await initSqlJs()

  dbPath = join(app.getPath('userData'), DB_FILENAME)
  console.log(`[DB] Opening database at: ${dbPath}`)

  // Ensure directory exists
  const dir = app.getPath('userData')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  let db: SqlJsDatabase
  if (existsSync(dbPath)) {
    // Load existing database
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
    console.log('[DB] Loaded existing database')
  } else {
    // Create new database
    db = new SQL.Database()
    console.log('[DB] Created new database')
  }

  const wrapper = new DatabaseWrapper(db)
  sqlJsDb = db

  // Configure pragmas
  wrapper.pragma('foreign_keys = ON')

  // Run migrations
  runMigrations(wrapper)

  // Patch old legacy groq models
  wrapper
    .prepare(
      `
    UPDATE providers 
    SET default_model = 'llama-3.1-8b-instant' 
    WHERE name = 'groq' 
    AND (default_model = 'llama-3.1-70b-versatile' OR default_model = 'mixtral-8x7b-32768')
  `
    )
    .run()

  // Patch ollama localhost to 127.0.0.1 to avoid IPv6 issues on Windows
  wrapper
    .prepare(
      `
    UPDATE providers 
    SET base_url = 'http://127.0.0.1:11434' 
    WHERE name = 'ollama' 
    AND base_url = 'http://localhost:11434'
  `
    )
    .run()

  // Cleanup old data
  cleanupOldHistory(wrapper)

  // Save to disk
  wrapper.save()

  dbInstance = wrapper
  return wrapper
}

/**
 * Synchronous init for compatibility — wraps the async init
 * Called from main process, which can block on app.whenReady()
 */
export function initDatabase(): DatabaseWrapper {
  // For sync usage, we need the DB to already be initialized
  if (dbInstance) return dbInstance

  // This is a fallback — in practice, initDatabaseAsync should be called first
  throw new Error('Database not initialized. Call initDatabaseAsync() first in app.whenReady().')
}

/**
 * Get the database instance
 */
export function getDatabase(): DatabaseWrapper {
  if (!dbInstance) {
    throw new Error('Database not initialized.')
  }
  return dbInstance
}

/**
 * Close the database
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    sqlJsDb = null
    console.log('[DB] Database closed')
  }
}

/**
 * Manually save database to disk (call periodically or after writes)
 */
export function saveDatabase(): void {
  if (dbInstance) {
    dbInstance.save()
  }
}

// ====================================================
// Migration Runner
// ====================================================

function runMigrations(db: DatabaseWrapper): void {
  // Ensure schema_version table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const currentVersionRow = db
    .prepare('SELECT COALESCE(MAX(version), 0) as version FROM schema_version')
    .get() as { version: number } | undefined

  const currentVersion = currentVersionRow?.version ?? 0

  // Find migrations directory
  const possiblePaths = [
    join(__dirname, '../../migrations'),
    join(__dirname, '../../../migrations'),
    join(app.getAppPath(), 'migrations'),
    join(process.resourcesPath || '', 'migrations')
  ]

  let migrationsDir = ''
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      migrationsDir = p
      break
    }
  }

  if (!migrationsDir) {
    console.warn('[DB] No migrations directory found, skipping migrations')
    return
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let applied = 0
  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10)
    if (isNaN(version) || version <= currentVersion) continue

    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    const migrate = db.transaction(() => {
      // Split SQL by semicolons and execute each statement
      // (sql.js doesn't support multi-statement exec as well)
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      for (const stmt of statements) {
        try {
          db.exec(stmt)
        } catch (error) {
          console.warn(`[DB] Statement failed in ${file}:`, error)
          // Continue — some statements like CREATE TRIGGER might need special handling
        }
      }

      db.prepare('INSERT INTO schema_version (version, name) VALUES (?, ?)').run(version, file)
    })

    migrate()
    applied++
    console.log(`[DB] Applied migration: ${file}`)
  }

  if (applied > 0) {
    console.log(
      `[DB] ${applied} migration(s) applied. Current version: ${currentVersion + applied}`
    )
  } else {
    console.log(`[DB] Schema up to date (version ${currentVersion})`)
  }
}

function cleanupOldHistory(db: DatabaseWrapper): void {
  try {
    const retention = db
      .prepare("SELECT value FROM settings WHERE key = 'data_retention_days'")
      .get() as { value: string } | undefined

    const days = parseInt(retention?.value ?? '-1', 10)
    if (days <= 0) return

    const result = db
      .prepare("DELETE FROM prompt_history WHERE created_at < datetime('now', ? || ' days')")
      .run(`-${days}`)

    if (result.changes > 0) {
      console.log(`[DB] Cleaned up ${result.changes} old history entries`)
    }
  } catch (error) {
    console.warn('[DB] History cleanup failed:', error)
  }
}
