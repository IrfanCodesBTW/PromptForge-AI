// ====================================================
// PromptForge AI — Global Hotkey Manager
// ====================================================

import { globalShortcut, BrowserWindow } from 'electron'
import type { DatabaseWrapper } from '../../services/db/database'
import { DEFAULT_HOTKEY_BINDINGS, type HotkeyDefinition } from './defaults'
import { readClipboardSelection } from '../clipboard/reader'
import { writeToClipboard, writeAndPaste } from '../clipboard/writer'
import { PromptEngine } from '../../services/prompt/engine'
import { IPC_CHANNELS } from '../../shared/constants'
import type { EnhanceMode } from '../../shared/types'

export class HotkeyManager {
  private db: DatabaseWrapper
  private mainWindow: BrowserWindow
  private engine: PromptEngine
  private registeredShortcuts: string[] = []

  constructor(db: DatabaseWrapper, mainWindow: BrowserWindow) {
    this.db = db
    this.mainWindow = mainWindow
    this.engine = new PromptEngine(db)
  }

  /**
   * Register all default hotkeys
   */
  registerAll(): void {
    // Unregister first to prevent duplicate registrations or leak old keys
    this.unregisterAll()

    // Load custom bindings from DB, fallback to defaults
    const bindings = this.loadBindings()

    for (const binding of bindings) {
      this.register(binding)
    }

    console.log(`[Hotkeys] Registered ${this.registeredShortcuts.length} hotkeys`)
  }

  /**
   * Register a single hotkey
   */
  private register(binding: HotkeyDefinition): void {
    try {
      const accelerator = binding.accelerator.replace(/Ctrl/g, 'CommandOrControl')
      const success = globalShortcut.register(accelerator, () => {
        this.handleTrigger(binding)
      })

      if (success) {
        this.registeredShortcuts.push(accelerator)
      } else {
        console.warn(`[Hotkeys] Failed to register: ${binding.accelerator} (conflict?)`)
      }
    } catch (error) {
      console.error(`[Hotkeys] Error registering ${binding.accelerator}:`, error)
    }
  }

  /**
   * Handle a hotkey trigger
   */
  private async handleTrigger(binding: HotkeyDefinition): Promise<void> {
    console.log(`[Hotkeys] Triggered: ${binding.action}`)

    // Notify renderer that enhancement is starting
    this.mainWindow.webContents.send(IPC_CHANNELS.HOTKEY_TRIGGERED, {
      action: binding.action
    })

    try {
      // Step 1: Capture selected text from clipboard
      const selectedText = await readClipboardSelection()

      if (!selectedText || selectedText.trim().length === 0) {
        this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_ERROR, {
          code: 'NO_TEXT',
          message: 'No text selected. Select some text and try again.'
        })
        return
      }

      // Step 2: Enhance via the prompt engine
      const mode = binding.mode || ('enhance' as EnhanceMode)
      const result = await this.engine.enhance(selectedText, mode)

      // Step 3: Write result to clipboard and optionally paste
      const row = this.db.prepare("SELECT value FROM settings WHERE key = 'clipboard_auto_paste'").get() as { value: string } | undefined
      const autoPaste = row?.value === 'true'
      
      if (autoPaste) {
        await writeAndPaste(result.text)
      } else {
        await writeToClipboard(result.text)
      }

      // Step 4: Send result to renderer for display
      this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_RESULT, {
        enhanced: result.text,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        historyId: result.historyId || ''
      })
    } catch (error) {
      console.error(`[Hotkeys] Enhancement failed:`, error)
      this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_ERROR, {
        code: 'ENHANCE_FAILED',
        message: error instanceof Error ? error.message : 'Enhancement failed'
      })
    }
  }

  /**
   * Load hotkey bindings from database, with defaults fallback
   */
  private loadBindings(): HotkeyDefinition[] {
    try {
      const rows = this.db
        .prepare('SELECT action, keybinding FROM hotkeys WHERE is_active = 1')
        .all() as { action: string; keybinding: string }[]

      if (rows.length === 0) return DEFAULT_HOTKEY_BINDINGS

      return rows.map((row) => {
        const defaultBinding = DEFAULT_HOTKEY_BINDINGS.find((b) => b.action === row.action)
        return {
          action: row.action,
          accelerator: row.keybinding,
          mode: defaultBinding?.mode,
          description: defaultBinding?.description || row.action
        }
      })
    } catch {
      // Database not ready yet, use defaults
      return DEFAULT_HOTKEY_BINDINGS
    }
  }

  /**
   * Unregister all hotkeys
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registeredShortcuts = []
    console.log('[Hotkeys] All hotkeys unregistered')
  }

  /**
   * Re-register a single hotkey with a new binding
   */
  updateBinding(action: string, newAccelerator: string): boolean {
    // Find and unregister the old binding
    const oldBinding = this.registeredShortcuts.find((s) =>
      DEFAULT_HOTKEY_BINDINGS.some((b) => b.accelerator === s && b.action === action)
    )
    if (oldBinding) {
      globalShortcut.unregister(oldBinding)
      this.registeredShortcuts = this.registeredShortcuts.filter((s) => s !== oldBinding)
    }

    // Register with new accelerator
    const defaultBinding = DEFAULT_HOTKEY_BINDINGS.find((b) => b.action === action)
    if (defaultBinding) {
      this.register({ ...defaultBinding, accelerator: newAccelerator })
      return true
    }
    return false
  }
}
