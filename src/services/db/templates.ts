// ====================================================
// PromptForge AI — Template Service (DB)
// ====================================================

import type { DatabaseWrapper } from './database'
import { generateId, now } from '../../shared/utils'
import type { Template } from '../../shared/types'

export class TemplateService {
  private db: DatabaseWrapper

  constructor(db: DatabaseWrapper) {
    this.db = db
  }

  /**
   * List all active templates, optionally filtered by category
   */
  list(category?: string): Template[] {
    let query = `SELECT * FROM templates WHERE is_active = 1`
    const params: string[] = []

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY is_builtin DESC, name ASC'

    const rows = this.db.prepare(query).all(...params) as TemplateRow[]
    return rows.map((row) => this.mapRow(row))
  }

  /**
   * Get a single template by ID
   */
  getById(id: string): Template | null {
    const row = this.db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as
      | TemplateRow
      | undefined
    return row ? this.mapRow(row) : null
  }

  /**
   * Get a template by name
   */
  getByName(name: string): Template | null {
    const row = this.db.prepare('SELECT * FROM templates WHERE name = ?').get(name) as
      | TemplateRow
      | undefined
    return row ? this.mapRow(row) : null
  }

  /**
   * Create a new custom template
   */
  create(data: {
    name: string
    description?: string
    category: string
    systemPrompt: string
    userPromptTemplate: string
    variables?: string
    isBuiltin?: boolean
  }): Template {
    const id = generateId()
    const timestamp = now()

    this.db
      .prepare(
        `INSERT INTO templates (id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.name,
        data.description || '',
        data.category,
        data.systemPrompt,
        data.userPromptTemplate,
        data.variables || '[]',
        data.isBuiltin ? 1 : 0,
        timestamp,
        timestamp
      )

    return this.getById(id)!
  }

  /**
   * Update a template (only non-builtin)
   */
  update(id: string, data: Partial<Template>): void {
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
    if (data.category !== undefined) {
      sets.push('category = ?')
      params.push(data.category)
    }
    if (data.systemPrompt !== undefined) {
      sets.push('system_prompt = ?')
      params.push(data.systemPrompt)
    }
    if (data.userPromptTemplate !== undefined) {
      sets.push('user_prompt_template = ?')
      params.push(data.userPromptTemplate)
    }
    if (data.variables !== undefined) {
      sets.push('variables = ?')
      params.push(JSON.stringify(data.variables))
    }

    sets.push('updated_at = ?')
    params.push(now())
    params.push(id)

    this.db.prepare(`UPDATE templates SET ${sets.join(', ')} WHERE id = ? AND is_builtin = 0`).run(...params)
  }

  /**
   * Soft-delete a template
   */
  delete(id: string): void {
    this.db.prepare('UPDATE templates SET is_active = 0 WHERE id = ? AND is_builtin = 0').run(id)
  }

  /**
   * Map database row to Template interface
   */
  private mapRow(row: TemplateRow): Template {
    let variables = []
    try {
      variables = JSON.parse(row.variables || '[]')
    } catch {
      variables = []
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      systemPrompt: row.system_prompt,
      userPromptTemplate: row.user_prompt_template,
      variables,
      isBuiltin: row.is_builtin === 1,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

interface TemplateRow {
  id: string
  name: string
  description: string | null
  category: string
  system_prompt: string
  user_prompt_template: string
  variables: string
  is_builtin: number
  is_active: number
  created_at: string
  updated_at: string
}
