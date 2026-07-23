// ====================================================
// PromptForge AI — Persona Service (DB)
// ====================================================
// Full typed CRUD for named, reusable persona profiles. Single-default
// enforcement happens here (not via a DB trigger) — see the note in
// migrations/003_personas.sql for why: the migration runner's naive
// semicolon-splitting can't safely execute multi-statement trigger bodies.

import type { DatabaseWrapper } from './database'
import { generateId, now } from '../../shared/utils'
import type { Persona, PersonaTone } from '../../shared/types'

export class PersonaService {
  private db: DatabaseWrapper

  constructor(db: DatabaseWrapper) {
    this.db = db
  }

  /**
   * List all personas, built-ins first, then alphabetical.
   */
  getAll(): Persona[] {
    const rows = this.db
      .prepare('SELECT * FROM personas ORDER BY is_builtin DESC, name ASC')
      .all() as PersonaRow[]
    return rows.map((row) => this.mapRow(row))
  }

  /**
   * Get a single persona by ID.
   */
  getById(id: string): Persona | null {
    const row = this.db.prepare('SELECT * FROM personas WHERE id = ?').get(id) as
      PersonaRow | undefined
    return row ? this.mapRow(row) : null
  }

  /**
   * Get the currently active default persona, or null if none is set
   * (in which case PromptEngine behavior must be identical to V1).
   */
  getDefault(): Persona | null {
    const row = this.db.prepare('SELECT * FROM personas WHERE is_default = 1 LIMIT 1').get() as
      PersonaRow | undefined
    return row ? this.mapRow(row) : null
  }

  /**
   * Create a new persona. If isDefault is true, clears the default flag on
   * every other persona first (single-default enforcement), all within one
   * transaction.
   */
  create(data: {
    name: string
    description?: string
    tone: PersonaTone
    formatRules?: string
    systemPromptInjection: string
    isDefault?: boolean
  }): Persona {
    const id = generateId()
    const timestamp = now()

    const runInsert = this.db.transaction(() => {
      if (data.isDefault) {
        this.db.prepare('UPDATE personas SET is_default = 0 WHERE is_default = 1').run()
      }

      this.db
        .prepare(
          `INSERT INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
        )
        .run(
          id,
          data.name,
          data.description || '',
          data.tone,
          data.formatRules || '',
          data.systemPromptInjection,
          data.isDefault ? 1 : 0,
          timestamp,
          timestamp
        )
    })

    runInsert()
    return this.getById(id)!
  }

  /**
   * Update an existing persona. If isDefault is set to true, clears the
   * default flag on every other persona first, in the same transaction.
   * Built-in personas can be updated (e.g. re-selected as default) but
   * their core identity fields are otherwise editable like any other —
   * only deletion is restricted for built-ins (see delete()).
   */
  update(
    id: string,
    data: Partial<{
      name: string
      description: string
      tone: PersonaTone
      formatRules: string
      systemPromptInjection: string
      isDefault: boolean
    }>
  ): void {
    const runUpdate = this.db.transaction(() => {
      if (data.isDefault) {
        this.db
          .prepare('UPDATE personas SET is_default = 0 WHERE id != ? AND is_default = 1')
          .run(id)
      }

      const sets: string[] = []
      const params: unknown[] = []

      if (data.name !== undefined) {
        sets.push('name = ?')
        params.push(data.name)
      }
      if (data.description !== undefined) {
        sets.push('description = ?')
        params.push(data.description)
      }
      if (data.tone !== undefined) {
        sets.push('tone = ?')
        params.push(data.tone)
      }
      if (data.formatRules !== undefined) {
        sets.push('format_rules = ?')
        params.push(data.formatRules)
      }
      if (data.systemPromptInjection !== undefined) {
        sets.push('system_prompt_injection = ?')
        params.push(data.systemPromptInjection)
      }
      if (data.isDefault !== undefined) {
        sets.push('is_default = ?')
        params.push(data.isDefault ? 1 : 0)
      }

      if (sets.length === 0) return

      sets.push('updated_at = ?')
      params.push(now())
      params.push(id)

      this.db.prepare(`UPDATE personas SET ${sets.join(', ')} WHERE id = ?`).run(...params)
    })

    runUpdate()
  }

  /**
   * Set a persona as the default (convenience wrapper around update()).
   * Used by the tray "Persona" submenu.
   */
  setDefault(id: string): void {
    this.update(id, { isDefault: true })
  }

  /**
   * Delete a persona. Built-in personas cannot be deleted (they can be
   * duplicated via create() with the same field values, but not removed).
   */
  delete(id: string): void {
    const persona = this.getById(id)
    if (!persona) return
    if (persona.isBuiltin) {
      throw new Error('Built-in personas cannot be deleted. Duplicate it to customize instead.')
    }
    this.db.prepare('DELETE FROM personas WHERE id = ? AND is_builtin = 0').run(id)
  }

  private mapRow(row: PersonaRow): Persona {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      tone: row.tone as PersonaTone,
      formatRules: row.format_rules || undefined,
      systemPromptInjection: row.system_prompt_injection,
      isDefault: row.is_default === 1,
      isBuiltin: row.is_builtin === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

interface PersonaRow {
  id: string
  name: string
  description: string | null
  tone: string
  format_rules: string | null
  system_prompt_injection: string
  is_default: number
  is_builtin: number
  created_at: string
  updated_at: string
}
