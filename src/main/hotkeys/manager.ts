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
import {
  getOrCreatePreviewWindow,
  closePreviewWindow,
  sendSourceText,
  sendTokenChunk,
  sendStreamDone,
  sendStreamError
} from '../windows/previewWindow'
import { getOrCreateHistoryWindow } from '../windows/historyWindow'

/**
 * State for a preview session currently awaiting user action
 * (Accept / Reject / Re-run). Cleared once the user acts or the window closes.
 */
interface PendingPreview {
  input: string
  mode: EnhanceMode
  /** Most recently streamed/fallback result text, ready to commit on Accept */
  latestText: string
}

export class HotkeyManager {
  private db: DatabaseWrapper
  private mainWindow: BrowserWindow
  private engine: PromptEngine
  private registeredShortcuts: string[] = []
  private pendingPreview: PendingPreview | null = null

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

    // The "history" action opens the Smart History quick-search picker
    // instead of running the clipboard-read/enhance pipeline.
    if (binding.action === 'history') {
      getOrCreateHistoryWindow()
      return
    }

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

      const mode = binding.mode || ('enhance' as EnhanceMode)

      if (this.isPreviewWindowEnabled()) {
        await this.runPreviewFlow(selectedText, mode)
      } else {
        await this.runLegacyFlow(selectedText, mode)
      }
    } catch (error) {
      console.error(`[Hotkeys] Enhancement failed:`, error)
      this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_ERROR, {
        code: 'ENHANCE_FAILED',
        message: error instanceof Error ? error.message : 'Enhancement failed'
      })
    }
  }

  /**
   * V1 behavior: enhance, write to clipboard (optionally auto-paste), notify
   * renderer. Used when the preview window feature flag is off.
   */
  private async runLegacyFlow(selectedText: string, mode: EnhanceMode): Promise<void> {
    const result = await this.engine.enhance(selectedText, mode)

    const autoPaste = this.isAutoPasteEnabled()
    if (autoPaste) {
      await writeAndPaste(result.text)
    } else {
      await writeToClipboard(result.text)
    }

    this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_RESULT, {
      enhanced: result.text,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      historyId: result.historyId || ''
    })
  }

  /**
   * V1.5 behavior: spawn/reuse the floating preview window and stream the
   * enhancement into it live. Clipboard write is deferred until the user
   * explicitly clicks/presses Accept — see handlePreviewAccept().
   */
  private async runPreviewFlow(selectedText: string, mode: EnhanceMode): Promise<void> {
    getOrCreatePreviewWindow()
    this.pendingPreview = { input: selectedText, mode, latestText: '' }
    // Send the original source text to the renderer BEFORE the stream starts
    // so PreviewApp can use it as `originalText` when starting a refinement session.
    sendSourceText({ sourceText: selectedText })
    await this.streamIntoPreview(selectedText, mode)
  }

  /**
   * Runs enhanceStream() and forwards each chunk to the preview window.
   * Shared by the initial trigger and the Re-run action.
   */
  private async streamIntoPreview(input: string, mode: EnhanceMode): Promise<void> {
    try {
      let fullText = ''
      const gen = this.engine.enhanceStream(input, mode)
      let next = await gen.next()
      while (!next.done) {
        const chunk = next.value
        fullText += chunk.text
        sendTokenChunk({
          text: chunk.text,
          done: chunk.done,
          provider: chunk.provider,
          isFallback: chunk.isFallback
        })
        next = await gen.next()
      }
      const result = next.value

      if (this.pendingPreview) {
        this.pendingPreview.latestText = result.text || fullText
      }

      sendStreamDone({
        enhanced: result.text,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        historyId: result.historyId || '',
        usedStreamFallback: result.usedStreamFallback ?? false
      })
    } catch (error) {
      // Both streaming AND the non-streaming fallback failed — genuine error.
      sendStreamError({
        code: 'ENHANCE_FAILED',
        message: error instanceof Error ? error.message : 'Enhancement failed'
      })
    }
  }

  /**
   * Handle the user clicking/pressing Accept in the preview window:
   * write the latest result to the clipboard (respecting auto-paste),
   * notify the main renderer, then close the preview window.
   */
  async handlePreviewAccept(): Promise<void> {
    const pending = this.pendingPreview
    if (!pending || !pending.latestText) {
      closePreviewWindow()
      this.pendingPreview = null
      return
    }

    const autoPaste = this.isAutoPasteEnabled()
    if (autoPaste) {
      await writeAndPaste(pending.latestText)
    } else {
      await writeToClipboard(pending.latestText)
    }

    this.mainWindow.webContents.send(IPC_CHANNELS.ENHANCE_RESULT, {
      enhanced: pending.latestText,
      provider: '',
      model: '',
      tokensUsed: 0,
      latencyMs: 0,
      historyId: ''
    })

    this.pendingPreview = null
    closePreviewWindow()
  }

  /**
   * Handle the user clicking/pressing Reject: discard everything, close
   * the preview window, write nothing to the clipboard.
   */
  handlePreviewReject(): void {
    this.pendingPreview = null
    closePreviewWindow()
  }

  /**
   * Handle the user clicking/pressing Re-run: clear the current output and
   * re-trigger the same enhance call on the same input/mode.
   */
  async handlePreviewRerun(): Promise<void> {
    const pending = this.pendingPreview
    if (!pending) return

    pending.latestText = ''
    getOrCreatePreviewWindow()
    await this.streamIntoPreview(pending.input, pending.mode)
  }

  /**
   * Whether the floating preview window feature flag is enabled.
   * Defaults to false (V1 instant-clipboard behavior) if unset.
   */
  private isPreviewWindowEnabled(): boolean {
    try {
      const row = this.db
        .prepare("SELECT value FROM settings WHERE key = 'preview_window_enabled'")
        .get() as { value: string } | undefined
      return row?.value === 'true'
    } catch {
      return false
    }
  }

  private isAutoPasteEnabled(): boolean {
    const row = this.db
      .prepare("SELECT value FROM settings WHERE key = 'clipboard_auto_paste'")
      .get() as { value: string } | undefined
    return row?.value === 'true'
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
