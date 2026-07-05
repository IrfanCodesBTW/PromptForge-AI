// ====================================================
// PromptForge AI — IPC Handlers
// ====================================================
// Registers all ipcMain.handle handlers that the renderer calls.

import { ipcMain, app, BrowserWindow } from 'electron'
import type { DatabaseWrapper } from '../../services/db/database'
import { IPC_CHANNELS } from '../../shared/constants'
import { PromptEngine } from '../../services/prompt/engine'
import { HistoryService } from '../../services/db/history'
import { TemplateService } from '../../services/db/templates'
import { GroqProvider } from '../../services/ai/groq'
import { OpenAIProvider } from '../../services/ai/openai'
import { OllamaProvider } from '../../services/ai/ollama'
import type { EnhanceRequest, HistoryFilter } from '../../shared/types'
import type { HotkeyManager } from '../hotkeys/manager'

export function registerIpcHandlers(
  db: DatabaseWrapper,
  getHotkeyManager: () => HotkeyManager | null
): void {
  const engine = new PromptEngine(db)
  const history = new HistoryService(db)
  const templates = new TemplateService(db)

  // ===== Enhancement =====

  ipcMain.handle(IPC_CHANNELS.ENHANCE_REQUEST, async (_event, request: EnhanceRequest) => {
    const result = await engine.enhance(request.text, request.mode, {
      provider: request.provider,
      model: request.model,
      templateId: request.templateId
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
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, data: { key: string; value: string }) => {
    db.prepare(
      `INSERT INTO settings (key, value, type, category, updated_at)
       VALUES (?, ?, 'string', 'general', datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).run(data.key, data.value)

    // Broadcast settings change to all windows
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(IPC_CHANNELS.SETTINGS_CHANGED, data)
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
      return history.query(data.filter, data.page, data.pageSize)
    }
  )

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, (_event, id: string) => {
    return history.getById(id)
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, ids: string[]) => {
    history.deleteByIds(ids)
  })

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_FAVORITE,
    (_event, data: { id: string; isFavorite: boolean }) => {
      history.toggleFavorite(data.id, data.isFavorite)
    }
  )

  // ===== Templates =====

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_LIST, (_event, category?: string) => {
    return templates.list(category)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET, (_event, id: string) => {
    return templates.getById(id)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CREATE, (_event, data) => {
    return templates.create(data)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_UPDATE, (_event, data: { id: string }) => {
    const { id, ...rest } = data
    templates.update(id, rest)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_DELETE, (_event, id: string) => {
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

  ipcMain.handle(IPC_CHANNELS.PROVIDER_MODELS, async (_event, providerName: string) => {
    return engine.getRouter().listModels(providerName)
  })

  ipcMain.handle(
    IPC_CHANNELS.PROVIDER_TEST,
    async (_event, data: { provider: string; apiKey: string }) => {
      let provider: AIProvider | null = null
      
      const row = db.prepare('SELECT default_model FROM providers WHERE name = ?').get(data.provider) as { default_model: string } | undefined
      const defaultModel = row?.default_model || undefined

      if (data.provider === 'groq') {
        provider = new GroqProvider(data.apiKey, defaultModel)
      } else if (data.provider === 'openai' || data.provider === 'openrouter') {
        provider = new OpenAIProvider(data.apiKey, defaultModel, undefined, data.provider, data.provider)
      }

      if (!provider) {
        return { name: data.provider, status: 'offline', lastChecked: new Date().toISOString() }
      }
      const available = await provider.isAvailable()
      return {
        name: data.provider,
        status: available ? 'healthy' : 'offline',
        lastChecked: new Date().toISOString()
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROVIDER_UPDATE,
    async (_event, data: { provider: string; apiKey?: string; model?: string }) => {
      try {
        const { safeStorage } = require('electron')
        let encryptedKey = data.apiKey
        if (data.apiKey && safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
          const buffer = safeStorage.encryptString(data.apiKey)
          encryptedKey = buffer.toString('base64')
        }

        const existing = db.prepare('SELECT id FROM providers WHERE name = ?').get(data.provider)
        
        if (existing) {
          if (data.apiKey !== undefined) {
             db.prepare('UPDATE providers SET api_key_encrypted = ?, is_active = 1 WHERE name = ?').run(encryptedKey, data.provider)
          }
          if (data.model !== undefined) {
             db.prepare('UPDATE providers SET default_model = ?, is_active = 1 WHERE name = ?').run(data.model, data.provider)
          }
        } else {
          let baseUrl = ''
          let defaultModel = data.model || ''
          if (!defaultModel) {
            if (data.provider === 'groq') defaultModel = 'llama-3.1-8b-instant'
            if (data.provider === 'openai') {
               baseUrl = 'https://api.openai.com/v1'
               defaultModel = 'gpt-4o'
            }
            if (data.provider === 'openrouter') {
               baseUrl = 'https://openrouter.ai/api/v1'
               defaultModel = 'anthropic/claude-3.5-sonnet'
            }
          }
          db.prepare('INSERT INTO providers (name, type, base_url, api_key_encrypted, default_model, is_active, priority) VALUES (?, ?, ?, ?, ?, 1, 50)').run(
            data.provider, data.provider === 'ollama' ? 'local' : 'cloud', baseUrl, encryptedKey, defaultModel
          )
        }
        db.save()

        // Fetch the default model to properly initialize the new provider
        const row = db.prepare('SELECT default_model, api_key_encrypted FROM providers WHERE name = ?').get(data.provider) as { default_model: string, api_key_encrypted: string | null } | undefined
        const defaultModel = row?.default_model || undefined
        
        let apiKeyForInit = data.apiKey
        if (apiKeyForInit === undefined && row?.api_key_encrypted) {
           const { safeStorage } = require('electron')
           try {
             apiKeyForInit = safeStorage.decryptString(Buffer.from(row.api_key_encrypted, 'base64'))
           } catch {
             apiKeyForInit = row.api_key_encrypted
           }
        }

        if (data.provider === 'groq') {
          engine.getRouter().registerProvider('groq', new GroqProvider(apiKeyForInit || '', defaultModel))
        } else if (data.provider === 'openai' || data.provider === 'openrouter') {
          engine.getRouter().registerProvider(data.provider, new OpenAIProvider(apiKeyForInit || '', defaultModel, undefined, data.provider, data.provider))
        } else if (data.provider === 'ollama') {
          engine.getRouter().registerProvider('ollama', new OllamaProvider('http://localhost:11434', defaultModel))
        }
        
        return { success: true }
      } catch (err: any) {
        console.error('[IPC] PROVIDER_UPDATE Error:', err)
        throw err
      }
    }
  )
  ipcMain.removeHandler(IPC_CHANNELS.PROVIDER_MODELS)
  ipcMain.handle(IPC_CHANNELS.PROVIDER_MODELS, async (_event, data: { provider: string }) => {
    try {
      const provider = engine.getRouter().getProvider(data.provider)
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
    db.prepare('UPDATE hotkeys SET keybinding = ?, is_active = ? WHERE id = ?').run(
      binding.keybinding,
      binding.is_active ? 1 : 0,
      binding.id
    )
    const hm = getHotkeyManager()
    if (hm) {
      hm.registerAll()
    }
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
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    switch (data.action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        win.isMaximized() ? win.unmaximize() : win.maximize()
        break
      case 'close':
        win.hide()
        break
    }
  })

  console.log('[IPC] All handlers registered')
}
