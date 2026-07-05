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
import type { EnhanceRequest, HistoryFilter } from '../../shared/types'

export function registerIpcHandlers(db: DatabaseWrapper): void {
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
    async (_event, data: { provider: string; apiKey?: string }) => {
      const provider = engine.getRouter().getProvider(data.provider)
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
        win.close()
        break
    }
  })

  console.log('[IPC] All handlers registered')
}
