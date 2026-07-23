// ====================================================
// PromptForge AI — IPC Handlers
// ====================================================
// Registers all ipcMain.handle handlers that the renderer calls.
// Validates parameters on all incoming IPC invoke calls to prevent attacks.

import { ipcMain, app, BrowserWindow, clipboard } from 'electron'
import { z } from 'zod'
import type { DatabaseWrapper } from '../../services/db/database'
import { IPC_CHANNELS } from '../../shared/constants'
import { PromptEngine } from '../../services/prompt/engine'
import { HistoryService } from '../../services/db/history'
import { TemplateService } from '../../services/db/templates'
import { PersonaService } from '../../services/db/personaService'
import {
  personaCreateSchema,
  personaUpdateSchema,
  personaIdSchema
} from '../../shared/schemas/persona'
import {
  refinementStartSchema,
  refinementInstructionSchema,
  refinementSessionIdSchema
} from '../../shared/schemas/refinement'
import { refinementSessionManager } from '../../services/refinementSession'
import { refreshPersonaMenu } from '../tray/tray'
import { closeHistoryWindow, getOrCreateHistoryWindow } from '../windows/historyWindow'
import { getOrCreatePreviewWindow } from '../windows/previewWindow'
import { GroqProvider } from '../../services/ai/groq'
import { OpenAIProvider } from '../../services/ai/openai'
import { OllamaProvider } from '../../services/ai/ollama'
import type { AIProvider } from '../../services/ai/provider'
import type { EnhanceRequest, HistoryFilter } from '../../shared/types'
import type { HotkeyManager } from '../hotkeys/manager'
import logger from '../../shared/logger'

// ====================================================
// Zod Security Validation Schemas
// ====================================================

const enhanceRequestSchema = z.object({
  text: z.string().min(1).max(50000),
  mode: z.enum([
    'enhance',
    'expand',
    'compress',
    'explain',
    'translate',
    'grammar-fix',
    'convert-prd',
    'convert-markdown',
    'notes-to-prompt'
  ]),
  templateId: z
    .string()
    .regex(/^[a-fA-F0-9]{32}$/)
    .optional(),
  provider: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional()
})

const settingsSetSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000)
})

const historyQuerySchema = z.object({
  filter: z.object({
    search: z.string().max(100).optional(),
    provider: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    isFavorite: z.boolean().optional(),
    dateFrom: z.string().max(50).optional(),
    dateTo: z.string().max(50).optional()
  }),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
})

const historyFavoriteSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{32}$/),
  isFavorite: z.boolean()
})

const historyRecentSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  query: z.string().max(200).optional()
})

const historyRestoreSchema = z.object({
  originalText: z.string().min(1).max(50000),
  enhancedText: z.string().min(1).max(50000),
  provider: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  category: z.string().max(50).optional(),
  tokensUsed: z.number().int().min(0).optional(),
  latencyMs: z.number().int().min(0).optional()
})

const templateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50),
  systemPrompt: z.string().min(1).max(10000),
  userPromptTemplate: z.string().min(1).max(10000),
  variables: z.string().optional(),
  isBuiltin: z.boolean().optional()
})

const templateUpdateSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{32}$/),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50).optional(),
  systemPrompt: z.string().min(1).max(10000).optional(),
  userPromptTemplate: z.string().min(1).max(10000).optional(),
  variables: z.any().optional(), // Can be string or parsed array
  isActive: z.boolean().optional()
})

const providerTestSchema = z.object({
  provider: z.string().min(1).max(100),
  apiKey: z.string().max(1000)
})

const providerUpdateSchema = z.object({
  provider: z.string().min(1).max(100),
  apiKey: z.string().max(1000).optional(),
  model: z.string().min(1).max(100).optional()
})

const hotkeyUpdateSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{32}$/),
  action: z.string().min(1).max(100),
  keybinding: z.string().min(1).max(50),
  is_active: z.boolean().or(z.number())
})

const windowToggleSchema = z.object({
  action: z.enum(['minimize', 'maximize', 'close'])
})

export function registerIpcHandlers(
  db: DatabaseWrapper,
  getHotkeyManager: () => HotkeyManager | null
): void {
  const engine = new PromptEngine(db)
  const history = new HistoryService(db)
  const templates = new TemplateService(db)
  const personas = new PersonaService(db)

  // Listen to Renderer logs and pipe them to local disk
  ipcMain.on('promptforge:app:log', (_event, entry) => {
    logger.writeToLogFile(entry)
  })

  // ===== Enhancement =====

  ipcMain.handle(IPC_CHANNELS.ENHANCE_REQUEST, async (_event, request: EnhanceRequest) => {
    // Validate request schema
    const parsed = enhanceRequestSchema.parse(request)

    const result = await engine.enhance(parsed.text, parsed.mode, {
      provider: parsed.provider,
      model: parsed.model,
      templateId: parsed.templateId
    })

    return {
      enhanced: result.text,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      historyId: result.historyId || ''
    }
  })

  // ===== Settings =====

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
    z.string().min(1).max(100).parse(key)
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      { value: string } | undefined
    return row?.value ?? null
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, data: { key: string; value: string }) => {
    const parsed = settingsSetSchema.parse(data)

    db.prepare(
      `INSERT INTO settings (key, value, type, category, updated_at)
       VALUES (?, ?, 'string', 'general', datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).run(parsed.key, parsed.value)

    // Broadcast settings change to all windows
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IPC_CHANNELS.SETTINGS_CHANGED, parsed)
    })
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as {
      key: string
      value: string
    }[]
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    return settings
  })

  // ===== History =====

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_QUERY,
    (_event, data: { filter: HistoryFilter; page: number; pageSize: number }) => {
      const parsed = historyQuerySchema.parse(data)
      return history.query(parsed.filter, parsed.page, parsed.pageSize)
    }
  )

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, (_event, id: string) => {
    z.string()
      .regex(/^[a-fA-F0-9]{32}$/)
      .parse(id)
    return history.getById(id)
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, ids: string[]) => {
    const parsed = z.array(z.string().regex(/^[a-fA-F0-9]{32}$/)).parse(ids)
    history.deleteByIds(parsed)
  })

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_FAVORITE,
    (_event, data: { id: string; isFavorite: boolean }) => {
      const parsed = historyFavoriteSchema.parse(data)
      history.toggleFavorite(parsed.id, parsed.isFavorite)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_RECENT,
    (_event, data: { limit?: number; query?: string }) => {
      const parsed = historyRecentSchema.parse({ limit: data?.limit ?? 20, query: data?.query })
      return history.getRecentHistory(parsed.limit, parsed.query)
    }
  )

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR_ALL, () => {
    history.deleteAll()
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_RECOPY, (_event, id: string) => {
    z.string()
      .regex(/^[a-fA-F0-9]{32}$/)
      .parse(id)
    const entry = history.getById(id)
    if (entry) {
      clipboard.writeText(entry.enhancedText)
      return true
    }
    return false
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_WINDOW_CLOSE, () => {
    closeHistoryWindow()
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_RESTORE, (_event, data: unknown) => {
    const parsed = historyRestoreSchema.parse(data)
    return history.create({
      originalText: parsed.originalText,
      enhancedText: parsed.enhancedText,
      provider: parsed.provider,
      model: parsed.model,
      category: parsed.category,
      tokensUsed: parsed.tokensUsed,
      latencyMs: parsed.latencyMs
    })
  })

  // ===== Templates =====

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_LIST, (_event, category?: string) => {
    const validatedCategory = category ? z.string().max(100).parse(category) : undefined
    return templates.list(validatedCategory)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET, (_event, id: string) => {
    z.string()
      .regex(/^[a-fA-F0-9]{32}$/)
      .parse(id)
    return templates.getById(id)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CREATE, (_event, data) => {
    const parsed = templateCreateSchema.parse(data)
    return templates.create(parsed)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_UPDATE, (_event, data: { id: string }) => {
    const parsed = templateUpdateSchema.parse(data)
    const { id, ...rest } = parsed
    templates.update(id, rest)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_DELETE, (_event, id: string) => {
    z.string()
      .regex(/^[a-fA-F0-9]{32}$/)
      .parse(id)
    templates.delete(id)
  })

  // ===== Providers =====

  ipcMain.handle(IPC_CHANNELS.PROVIDER_LIST, () => {
    const rows = db.prepare('SELECT * FROM providers ORDER BY priority DESC').all()
    return rows
  })

  ipcMain.handle(IPC_CHANNELS.PROVIDER_STATUS, async () => {
    return engine.getRouter().checkAllHealth()
  })

  ipcMain.handle(
    IPC_CHANNELS.PROVIDER_TEST,
    async (_event, data: { provider: string; apiKey: string }) => {
      const parsed = providerTestSchema.parse(data)
      let provider: AIProvider | null = null

      const row = db
        .prepare('SELECT default_model FROM providers WHERE name = ?')
        .get(parsed.provider) as { default_model: string } | undefined
      const defaultModel = row?.default_model || undefined

      if (parsed.provider === 'groq') {
        provider = new GroqProvider(parsed.apiKey, defaultModel)
      } else if (parsed.provider === 'openai' || parsed.provider === 'openrouter') {
        provider = new OpenAIProvider(
          parsed.apiKey,
          defaultModel,
          undefined,
          parsed.provider,
          parsed.provider
        )
      }

      if (!provider) {
        return { name: parsed.provider, status: 'offline', lastChecked: new Date().toISOString() }
      }
      const available = await provider.isAvailable()
      return {
        name: parsed.provider,
        status: available ? 'healthy' : 'offline',
        lastChecked: new Date().toISOString()
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROVIDER_UPDATE,
    async (_event, data: { provider: string; apiKey?: string; model?: string }) => {
      try {
        const parsed = providerUpdateSchema.parse(data)
        const { safeStorage } = require('electron')
        let encryptedKey = parsed.apiKey
        if (
          parsed.apiKey &&
          safeStorage &&
          safeStorage.isEncryptionAvailable &&
          safeStorage.isEncryptionAvailable()
        ) {
          const buffer = safeStorage.encryptString(parsed.apiKey)
          encryptedKey = buffer.toString('base64')
        }

        const existing = db.prepare('SELECT id FROM providers WHERE name = ?').get(parsed.provider)

        if (existing) {
          if (parsed.apiKey !== undefined) {
            db.prepare(
              'UPDATE providers SET api_key_encrypted = ?, is_active = 1 WHERE name = ?'
            ).run(encryptedKey, parsed.provider)
          }
          if (parsed.model !== undefined) {
            db.prepare('UPDATE providers SET default_model = ?, is_active = 1 WHERE name = ?').run(
              parsed.model,
              parsed.provider
            )
          }
        } else {
          let baseUrl = ''
          let defaultModel = parsed.model || ''
          if (!defaultModel) {
            if (parsed.provider === 'groq') defaultModel = 'llama-3.1-8b-instant'
            if (parsed.provider === 'openai') {
              baseUrl = 'https://api.openai.com/v1'
              defaultModel = 'gpt-4o'
            }
            if (parsed.provider === 'openrouter') {
              baseUrl = 'https://openrouter.ai/api/v1'
              defaultModel = 'anthropic/claude-3.5-sonnet'
            }
          }
          db.prepare(
            'INSERT INTO providers (name, type, base_url, api_key_encrypted, default_model, is_active, priority) VALUES (?, ?, ?, ?, ?, 1, 50)'
          ).run(
            parsed.provider,
            parsed.provider === 'ollama' ? 'local' : 'cloud',
            baseUrl,
            encryptedKey,
            defaultModel
          )
        }
        db.save()

        // Fetch the default model to properly initialize the new provider
        const row = db
          .prepare('SELECT default_model, api_key_encrypted FROM providers WHERE name = ?')
          .get(parsed.provider) as
          { default_model: string; api_key_encrypted: string | null } | undefined
        const defaultModel = row?.default_model || undefined

        let apiKeyForInit = parsed.apiKey
        if (apiKeyForInit === undefined && row?.api_key_encrypted) {
          const { safeStorage: ss } = require('electron')
          try {
            apiKeyForInit = ss.decryptString(Buffer.from(row.api_key_encrypted, 'base64'))
          } catch {
            apiKeyForInit = row.api_key_encrypted
          }
        }

        if (parsed.provider === 'groq') {
          engine
            .getRouter()
            .registerProvider('groq', new GroqProvider(apiKeyForInit || '', defaultModel))
        } else if (parsed.provider === 'openai' || parsed.provider === 'openrouter') {
          engine
            .getRouter()
            .registerProvider(
              parsed.provider,
              new OpenAIProvider(
                apiKeyForInit || '',
                defaultModel,
                undefined,
                parsed.provider,
                parsed.provider
              )
            )
        } else if (parsed.provider === 'ollama') {
          engine
            .getRouter()
            .registerProvider('ollama', new OllamaProvider('http://127.0.0.1:11434', defaultModel))
        }

        return { success: true }
      } catch (err: any) {
        console.error('[IPC] PROVIDER_UPDATE Error:', err)
        throw err
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.PROVIDER_MODELS, async (_event, data: { provider: string }) => {
    try {
      const parsed = z.object({ provider: z.string() }).parse(data)
      const provider = engine.getRouter().getProvider(parsed.provider)
      if (provider) {
        return await provider.listModels()
      }
      return []
    } catch {
      return []
    }
  })

  // ===== Hotkeys =====

  ipcMain.handle(IPC_CHANNELS.HOTKEY_LIST, () => {
    return db.prepare('SELECT * FROM hotkeys ORDER BY action').all()
  })

  ipcMain.handle(IPC_CHANNELS.HOTKEY_UPDATE, (_event, binding) => {
    const parsed = hotkeyUpdateSchema.parse(binding)
    db.prepare('UPDATE hotkeys SET keybinding = ?, is_active = ? WHERE id = ?').run(
      parsed.keybinding,
      parsed.is_active ? 1 : 0,
      parsed.id
    )
    const hm = getHotkeyManager()
    if (hm) {
      hm.registerAll()
    }
  })

  // ===== Personas =====

  ipcMain.handle(IPC_CHANNELS.PERSONA_LIST, () => {
    return personas.getAll()
  })

  ipcMain.handle(IPC_CHANNELS.PERSONA_GET_DEFAULT, () => {
    return personas.getDefault()
  })

  ipcMain.handle(IPC_CHANNELS.PERSONA_CREATE, (_event, data) => {
    const parsed = personaCreateSchema.parse(data)
    const created = personas.create({
      name: parsed.name,
      description: parsed.description,
      tone: parsed.tone,
      formatRules: parsed.formatRules,
      systemPromptInjection: parsed.systemPromptInjection,
      isDefault: parsed.isDefault
    })
    refreshPersonaMenu()
    return created
  })

  ipcMain.handle(IPC_CHANNELS.PERSONA_UPDATE, (_event, data: { id: string }) => {
    const parsed = personaUpdateSchema.parse(data)
    const { id, ...rest } = parsed
    personas.update(id, rest)
    refreshPersonaMenu()
  })

  ipcMain.handle(IPC_CHANNELS.PERSONA_DELETE, (_event, id: string) => {
    personaIdSchema.parse(id)
    personas.delete(id)
    refreshPersonaMenu()
  })

  ipcMain.handle(IPC_CHANNELS.PERSONA_SET_DEFAULT, (_event, id: string) => {
    personaIdSchema.parse(id)
    personas.setDefault(id)
    refreshPersonaMenu()
  })

  // ===== App =====

  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => {
    return app.getVersion()
  })

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    app.quit()
  })

  // ===== Window Controls =====

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE, (_event, data: { action: string }) => {
    const parsed = windowToggleSchema.parse(data)
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    switch (parsed.action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
        break
      case 'close':
        win.hide()
        break
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN, (_event, data: { window: string }) => {
    if (data?.window === 'preview') {
      getOrCreatePreviewWindow()
    } else if (data?.window === 'history') {
      getOrCreateHistoryWindow()
    }
  })

  // ===== Preview Window Actions =====
  // Accept/Reject/Re-run are dispatched from the preview window's renderer.
  // The HotkeyManager owns the pending-preview state (input text, mode,
  // options) since it's the one that spawned the window in the first place.

  ipcMain.handle(IPC_CHANNELS.PREVIEW_ACCEPT, async () => {
    const hm = getHotkeyManager()
    if (hm) await hm.handlePreviewAccept()
  })

  ipcMain.handle(IPC_CHANNELS.PREVIEW_REJECT, () => {
    const hm = getHotkeyManager()
    if (hm) hm.handlePreviewReject()
  })

  ipcMain.handle(IPC_CHANNELS.PREVIEW_RERUN, async () => {
    const hm = getHotkeyManager()
    if (hm) await hm.handlePreviewRerun()
  })

  // ===== Refinement Loop Actions =====

  ipcMain.handle(IPC_CHANNELS.REFINEMENT_START, (_event, data) => {
    const parsed = refinementStartSchema.parse(data)
    const session = refinementSessionManager.createSession(db, {
      originalText: parsed.originalText,
      currentOutput: parsed.currentOutput,
      mode: parsed.mode as any,
      templateId: parsed.templateId,
      provider: parsed.provider,
      model: parsed.model
    })
    return { sessionId: session.sessionId }
  })

  ipcMain.handle(IPC_CHANNELS.REFINEMENT_SEND_INSTRUCTION, async (event, data) => {
    const parsed = refinementInstructionSchema.parse(data)
    const timeoutRow = db
      .prepare("SELECT value FROM settings WHERE key = 'refinementSessionTimeoutMinutes'")
      .get() as { value: string } | undefined
    const timeoutMinutes = timeoutRow?.value ? parseInt(timeoutRow.value, 10) : 5
    const session = refinementSessionManager.getSession(parsed.sessionId, timeoutMinutes)

    if (!session) {
      throw new Error(`Refinement session ${parsed.sessionId} not found or expired`)
    }

    try {
      const streamGen = session.refine(parsed.instruction)
      let next = await streamGen.next()
      while (!next.done) {
        const chunk = next.value
        event.sender.send(IPC_CHANNELS.REFINEMENT_TOKEN_CHUNK, {
          sessionId: session.sessionId,
          text: chunk.text,
          done: chunk.done,
          provider: chunk.provider,
          isFallback: chunk.isFallback
        })
        next = await streamGen.next()
      }

      const result = next.value
      event.sender.send(IPC_CHANNELS.REFINEMENT_DONE, {
        sessionId: session.sessionId,
        enhanced: result.text,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        usedStreamFallback: result.usedStreamFallback ?? false
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      event.sender.send(IPC_CHANNELS.REFINEMENT_ERROR, {
        sessionId: session.sessionId,
        code: 'REFINEMENT_FAILED',
        message
      })
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.REFINEMENT_END_SESSION, (_event, data) => {
    const parsed = refinementSessionIdSchema.parse(data)
    refinementSessionManager.endSession(parsed.sessionId)
    return { success: true }
  })

  console.log('[IPC] All handlers registered')
}
