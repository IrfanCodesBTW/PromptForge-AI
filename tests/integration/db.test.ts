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
    const row = db.prepare("SELECT value FROM settings WHERE key = 'theme'").get() as { value: string } | undefined
    expect(row).toBeDefined()
    expect(row?.value).toBe('system')
  })

  it('should support settings CRUD operations', () => {
    const db = getDatabase()
    
    // Set setting
    db.prepare("INSERT OR REPLACE INTO settings (key, value, type, category) VALUES ('testKey', 'testValue', 'string', 'general')").run()
    
    // Get setting
    const row = db.prepare("SELECT value FROM settings WHERE key = 'testKey'").get() as { value: string } | undefined
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

    const query2 = historyService.query({ provider: 'ollama', category: 'enhancement', isFavorite: true }, 1, 10)
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
    db.prepare("INSERT OR REPLACE INTO settings (key, value, type, category) VALUES ('data_retention_days', '30', 'number', 'general')").run()

    // Insert an old history entry (35 days old)
    const oldId = '00000000000000000000000000000001'
    db.prepare(`
      INSERT INTO prompt_history (id, original_text, enhanced_text, provider, model, category, tokens_used, latency_ms, is_favorite, created_at)
      VALUES (?, 'old', 'old enhanced', 'groq', 'llama', 'enhance', 10, 10, 0, datetime('now', '-35 days'))
    `).run(oldId)

    // Verify it exists in db
    const rowBefore = db.prepare('SELECT id FROM prompt_history WHERE id = ?').get(oldId)
    expect(rowBefore).toBeDefined()

    // Close and re-initialize database to trigger cleanup Old History
    closeDatabase()
    const reinitializedDb = await initDatabaseAsync()

    // Verify old entry was deleted by the retention manager
    const rowAfter = reinitializedDb.prepare('SELECT id FROM prompt_history WHERE id = ?').get(oldId)
    expect(rowAfter).toBeUndefined()
  })
})
