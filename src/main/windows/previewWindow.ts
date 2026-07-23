// ====================================================
// PromptForge AI — Floating Preview Window
// ====================================================
// A compact, always-on-top, frameless, transparent overlay that streams
// the live enhancement output near the cursor. Lifecycle (open/close/reopen)
// is managed entirely from the Main process — the existing main application
// window has zero awareness of this window's existence.

import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC_CHANNELS } from '../../shared/constants'
import type {
  PreviewTokenChunkPayload,
  PreviewStreamDonePayload,
  PreviewStreamErrorPayload,
  PreviewSourceTextPayload
} from '../../shared/types'

const PREVIEW_WIDTH = 420
const PREVIEW_MAX_HEIGHT = 420
const CURSOR_OFFSET = 16

let previewWindow: BrowserWindow | null = null

/**
 * Create (or return the existing) floating preview window, positioned near
 * the current cursor location. Safe to call repeatedly — reuses the window
 * if one is already open (Re-run flow) instead of spawning duplicates.
 */
export function getOrCreatePreviewWindow(): BrowserWindow {
  if (previewWindow && !previewWindow.isDestroyed()) {
    positionNearCursor(previewWindow)
    return previewWindow
  }

  const cursorPoint = screen.getCursorScreenPoint()

  const win = new BrowserWindow({
    width: PREVIEW_WIDTH,
    height: PREVIEW_MAX_HEIGHT,
    x: cursorPoint.x + CURSOR_OFFSET,
    y: cursorPoint.y + CURSOR_OFFSET,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    focusable: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      webSecurity: true
    }
  })

  // Auto-dismiss on focus loss — matches the "preview, don't commit" UX intent.
  win.on('blur', () => {
    closePreviewWindow()
  })

  win.on('closed', () => {
    if (previewWindow === win) {
      previewWindow = null
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/preview/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/preview/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  previewWindow = win
  return win
}

/**
 * Reposition an existing preview window near the current cursor location.
 * Used when reusing the window for a Re-run without recreating it.
 */
function positionNearCursor(win: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint()
  win.setPosition(cursorPoint.x + CURSOR_OFFSET, cursorPoint.y + CURSOR_OFFSET)
  win.show()
  win.focus()
}

/**
 * Close the preview window if it exists. Safe to call multiple times.
 */
export function closePreviewWindow(): void {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close()
  }
  previewWindow = null
}

/**
 * Get the current preview window instance, if one is open.
 */
export function getPreviewWindow(): BrowserWindow | null {
  return previewWindow && !previewWindow.isDestroyed() ? previewWindow : null
}

/**
 * True if a preview window is currently open (used by lifecycle/state-machine tests).
 */
export function isPreviewWindowOpen(): boolean {
  return getPreviewWindow() !== null
}

/**
 * Send the original selected text to the preview window so the renderer can
 * use it as the `originalText` when starting a multi-turn refinement session.
 * Must be called before the stream starts.
 */
export function sendSourceText(payload: PreviewSourceTextPayload): void {
  const win = getPreviewWindow()
  if (win) {
    win.webContents.send(IPC_CHANNELS.PREVIEW_SOURCE_TEXT, payload)
  }
}

/**
 * Push a streaming token chunk to the preview window's renderer.
 */
export function sendTokenChunk(payload: PreviewTokenChunkPayload): void {
  const win = getPreviewWindow()
  if (win) {
    win.webContents.send(IPC_CHANNELS.PREVIEW_TOKEN_CHUNK, payload)
  }
}

/**
 * Notify the preview window that the stream has finished successfully.
 */
export function sendStreamDone(payload: PreviewStreamDonePayload): void {
  const win = getPreviewWindow()
  if (win) {
    win.webContents.send(IPC_CHANNELS.PREVIEW_STREAM_DONE, payload)
  }
}

/**
 * Notify the preview window that the stream failed (both streaming AND the
 * non-streaming fallback failed — a genuine error, not a fallback notice).
 */
export function sendStreamError(payload: PreviewStreamErrorPayload): void {
  const win = getPreviewWindow()
  if (win) {
    win.webContents.send(IPC_CHANNELS.PREVIEW_STREAM_ERROR, payload)
  }
}
