// ====================================================
// PromptForge AI — Database Integration Tests
// ====================================================

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'

const testDir = path.join(__dirname, '../../test-userData')

// Mock Electron before any imports
vi.mock('electron', () => {
  return {
    app: {
      getPath: (name: string) => {
        if (name === 'userData') return testDir
        return testDir
      },
      getAppPath: () => path.join(__dirname, '../../')
    }
  }
})

import { initDatabaseAsync, getDatabase, closeDatabase } from '../../src/services/db/database'
import { HistoryService } from '../../src/services/db/history'
import { TemplateService } from '../../src/services/db/templates'
import { PersonaService } from '../../src/services/db/personaService'

describe('Database Integration', () => {
  beforeAll(async () => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    // Set up dummy migrations directory for test
    const dummyMigrationsDir = path.join(testDir, 'migrations')
    if (!fs.existsSync(dummyMigrationsDir)) {
      fs.mkdirSync(dummyMigrationsDir, { recursive: true })
    }
    // Copy real migration files to dummy directory for test execution
    const realMigrationsDir = path.join(__dirname, '../../migrations')
    if (fs.existsSync(realMigrationsDir)) {
      const files = fs.readdirSync(realMigrationsDir)
      for (const file of files) {
        fs.copyFileSync(path.join(realMigrationsDir, file), path.join(dummyMigrationsDir, file))
      }
    }
  })

  afterAll(() => {
    closeDatabase()
    // Cleanup test userData directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should initialize database and run migrations', async () => {
    const db = await initDatabaseAsync()
    expect(db).toBeDefined()

    // Verify settings table got seeded
    const row = db.prepare("SELECT value FROM settings WHERE key = 'theme'").get() as
      { value: string } | undefined
    expect(row).toBeDefined()
    expect(row?.value).toBe('system')
  })

  it('should support settings CRUD operations', () => {
    const db = getDatabase()

    // Set setting
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value, type, category) VALUES ('testKey', 'testValue', 'string', 'general')"
    ).run()

    // Get setting
    const row = db.prepare("SELECT value FROM settings WHERE key = 'testKey'").get() as
      { value: string } | undefined
    expect(row?.value).toBe('testValue')
  })

  it('should manage templates via TemplateService', () => {
    const db = getDatabase()
    const templateService = new TemplateService(db)

    // Create template
    const template = templateService.create({
      name: 'Test Template',
      description: 'A test template description',
      category: 'testing',
      systemPrompt: 'System instruction',
      userPromptTemplate: 'User input {{input}}',
      isBuiltin: false
    })

    expect(template.id).toBeDefined()
    expect(template.name).toBe('Test Template')

    // List templates
    const list = templateService.list('testing')
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list[0].name).toBe('Test Template')

    // Get template by name
    const found = templateService.getByName('Test Template')
    expect(found?.id).toBe(template.id)

    // Update template
    templateService.update(template.id, { description: 'Updated description' })
    const updated = templateService.getById(template.id)
    expect(updated?.description).toBe('Updated description')

    // Delete template
    templateService.delete(template.id)
    const deleted = templateService.getById(template.id)
    expect(deleted?.isActive).toBe(false)
  })

  it('should record enhancements history via HistoryService and support advanced queries', () => {
    const db = getDatabase()
    const historyService = new HistoryService(db)

    const id = historyService.create({
      originalText: 'rough text search_target',
      enhancedText: 'polished prompt text',
      provider: 'ollama',
      model: 'llama3.1',
      category: 'enhancement',
      tokensUsed: 100,
      latencyMs: 500
    })

    expect(id).toBeDefined()

    // Fetch and check history
    const entry = historyService.getById(id)
    expect(entry?.originalText).toBe('rough text search_target')
    expect(entry?.enhancedText).toBe('polished prompt text')
    expect(entry?.tokensUsed).toBe(100)
    expect(entry?.isFavorite).toBe(false)

    // Toggle favorite
    historyService.toggleFavorite(id, true)
    const entryFav = historyService.getById(id)
    expect(entryFav?.isFavorite).toBe(true)

    // Test advanced query with filter permutations
    const query1 = historyService.query({ search: 'search_target' }, 1, 10)
    expect(query1.items.length).toBe(1)
    expect(query1.items[0].id).toBe(id)

    const query2 = historyService.query(
      { provider: 'ollama', category: 'enhancement', isFavorite: true },
      1,
      10
    )
    expect(query2.items.length).toBe(1)

    const query3 = historyService.query({ dateFrom: '2020-01-01', dateTo: '2030-01-01' }, 1, 10)
    expect(query3.items.length).toBe(1)

    // Query stats
    const stats = historyService.getStats()
    expect(stats.totalEnhancements).toBeGreaterThanOrEqual(1)

    // Clean up
    historyService.deleteByIds([id])
    expect(historyService.getById(id)).toBeNull()

    // Test delete all
    historyService.deleteAll()
    const statsAfter = historyService.getStats()
    expect(statsAfter.totalEnhancements).toBe(0)
  })

  it('should perform history cleanup based on retention policy', async () => {
    const db = getDatabase()

    // Set retention days to 30
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value, type, category) VALUES ('data_retention_days', '30', 'number', 'general')"
    ).run()

    // Insert an old history entry (35 days old)
    const oldId = '00000000000000000000000000000001'
    db.prepare(
      `
      INSERT INTO prompt_history (id, original_text, enhanced_text, provider, model, category, tokens_used, latency_ms, is_favorite, created_at)
      VALUES (?, 'old', 'old enhanced', 'groq', 'llama', 'enhance', 10, 10, 0, datetime('now', '-35 days'))
    `
    ).run(oldId)

    // Verify it exists in db
    const rowBefore = db.prepare('SELECT id FROM prompt_history WHERE id = ?').get(oldId)
    expect(rowBefore).toBeDefined()

    // Close and re-initialize database to trigger cleanup Old History
    closeDatabase()
    const reinitializedDb = await initDatabaseAsync()

    // Verify old entry was deleted by the retention manager
    const rowAfter = reinitializedDb
      .prepare('SELECT id FROM prompt_history WHERE id = ?')
      .get(oldId)
    expect(rowAfter).toBeUndefined()
  })

  it('should apply the personas migration (003_personas.sql) correctly against the real runner', () => {
    const db = getDatabase()

    // 5 built-in personas seeded, General marked as default
    const personaRows = db.prepare('SELECT * FROM personas ORDER BY name').all() as {
      name: string
      is_default: number
      is_builtin: number
    }[]
    expect(personaRows.length).toBe(5)
    expect(personaRows.map((r) => r.name).sort()).toEqual(
      ['Creative', 'Developer', 'Executive', 'General', 'Social'].sort()
    )

    const defaults = personaRows.filter((r) => r.is_default === 1)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].name).toBe('General')
    expect(personaRows.every((r) => r.is_builtin === 1)).toBe(true)

    // persona_override_allowed column exists on templates, and every
    // pre-existing built-in template has it explicitly disabled
    const templateRows = db
      .prepare('SELECT is_builtin, persona_override_allowed FROM templates WHERE is_builtin = 1')
      .all() as { is_builtin: number; persona_override_allowed: number }[]
    expect(templateRows.length).toBeGreaterThan(0)
    expect(templateRows.every((r) => r.persona_override_allowed === 0)).toBe(true)
  })

  it('should manage personas via PersonaService with single-default enforcement', () => {
    const db = getDatabase()
    const personaService = new PersonaService(db)

    // getDefault() should return the seeded General persona
    const defaultPersona = personaService.getDefault()
    expect(defaultPersona?.name).toBe('General')

    // Create a new persona and set it as default
    const custom = personaService.create({
      name: 'Custom QA Persona',
      tone: 'technical',
      systemPromptInjection: 'Write like a meticulous QA engineer.',
      isDefault: true
    })

    expect(custom.isDefault).toBe(true)

    // Only one persona should be default now
    const allPersonas = personaService.getAll()
    const defaultsAfter = allPersonas.filter((p) => p.isDefault)
    expect(defaultsAfter).toHaveLength(1)
    expect(defaultsAfter[0].id).toBe(custom.id)

    // General should no longer be default
    const generalAfter = allPersonas.find((p) => p.name === 'General')
    expect(generalAfter?.isDefault).toBe(false)

    // Switching default back to General via setDefault()
    personaService.setDefault(generalAfter!.id)
    const afterSwitch = personaService.getAll().filter((p) => p.isDefault)
    expect(afterSwitch).toHaveLength(1)
    expect(afterSwitch[0].name).toBe('General')

    // Built-in personas cannot be deleted
    expect(() => personaService.delete(generalAfter!.id)).toThrow()

    // Custom (non-builtin) personas can be deleted
    personaService.delete(custom.id)
    expect(personaService.getById(custom.id)).toBeNull()
  })

  it('should create the prompt_history_fts virtual table and keep it in sync via HistoryService', () => {
    const db = getDatabase()
    const historyService = new HistoryService(db)

    // Confirm the FTS4 virtual table exists and is queryable directly
    expect(() => db.prepare('SELECT * FROM prompt_history_fts LIMIT 1').all()).not.toThrow()

    const id1 = historyService.create({
      originalText: 'a rough draft about quantum computing',
      enhancedText: 'a polished explanation of quantum computing fundamentals',
      provider: 'ollama',
      model: 'llama3.1',
      category: 'enhancement'
    })

    const id2 = historyService.create({
      originalText: 'notes about baking sourdough bread',
      enhancedText: 'a structured recipe for sourdough bread',
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      category: 'enhancement'
    })

    // FTS MATCH should find the quantum entry but not the sourdough one
    const quantumResults = historyService.getRecentHistory(10, 'quantum')
    expect(quantumResults.some((e) => e.id === id1)).toBe(true)
    expect(quantumResults.some((e) => e.id === id2)).toBe(false)

    const breadResults = historyService.getRecentHistory(10, 'sourdough')
    expect(breadResults.some((e) => e.id === id2)).toBe(true)
    expect(breadResults.some((e) => e.id === id1)).toBe(false)

    // query() with a search filter should also use the FTS path and find matches
    const queried = historyService.query({ search: 'quantum' }, 1, 10)
    expect(queried.items.some((e) => e.id === id1)).toBe(true)

    historyService.deleteByIds([id1, id2])
  })

  it('should fall back to recency ordering when no query is provided', () => {
    const db = getDatabase()
    const historyService = new HistoryService(db)

    const id1 = historyService.create({
      originalText: 'first entry',
      enhancedText: 'first enhanced',
      provider: 'ollama',
      model: 'llama3.1'
    })
    const id2 = historyService.create({
      originalText: 'second entry',
      enhancedText: 'second enhanced',
      provider: 'ollama',
      model: 'llama3.1'
    })

    const results = historyService.getRecentHistory(20)
    const ids = results.map((r) => r.id)
    // Most recent first
    expect(ids.indexOf(id2)).toBeLessThan(ids.indexOf(id1))

    historyService.deleteByIds([id1, id2])
  })

  it('should remove FTS index entries when history entries are deleted', () => {
    const db = getDatabase()
    const historyService = new HistoryService(db)

    const id = historyService.create({
      originalText: 'unique searchable phrase xyzzy',
      enhancedText: 'enhanced xyzzy content',
      provider: 'ollama',
      model: 'llama3.1'
    })

    expect(historyService.getRecentHistory(10, 'xyzzy').some((e) => e.id === id)).toBe(true)

    historyService.deleteByIds([id])

    expect(historyService.getRecentHistory(10, 'xyzzy').some((e) => e.id === id)).toBe(false)
  })
})
