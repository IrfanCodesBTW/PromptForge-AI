// ====================================================
// PromptForge AI — Smart History Picker Window
// ====================================================
// A compact, always-on-top, frameless, transparent overlay for quick
// full-text search + re-copy over recent prompt history. Speed-first
// (top N results, keyboard nav) — full CRUD/pagination lives in the main
// app's History settings tab instead.

import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const HISTORY_WINDOW_WIDTH = 560
const HISTORY_WINDOW_HEIGHT = 480
const CURSOR_OFFSET = 16

let historyWindow: BrowserWindow | null = null

/**
 * Create (or return the existing) history picker window, positioned near
 * the current cursor location. Reuses the window if one is already open.
 */
export function getOrCreateHistoryWindow(): BrowserWindow {
  if (historyWindow && !historyWindow.isDestroyed()) {
    positionNearCursor(historyWindow)
    return historyWindow
  }

  const cursorPoint = screen.getCursorScreenPoint()

  const win = new BrowserWindow({
    width: HISTORY_WINDOW_WIDTH,
    height: HISTORY_WINDOW_HEIGHT,
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

  win.on('blur', () => {
    closeHistoryWindow()
  })

  win.on('closed', () => {
    if (historyWindow === win) {
      historyWindow = null
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/history-picker/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/history-picker/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  historyWindow = win
  return win
}

function positionNearCursor(win: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint()
  win.setPosition(cursorPoint.x + CURSOR_OFFSET, cursorPoint.y + CURSOR_OFFSET)
  win.show()
  win.focus()
}

/**
 * Close the history picker window if it exists. Safe to call multiple times.
 */
export function closeHistoryWindow(): void {
  if (historyWindow && !historyWindow.isDestroyed()) {
    historyWindow.close()
  }
  historyWindow = null
}

/**
 * True if the history picker window is currently open.
 */
export function isHistoryWindowOpen(): boolean {
  return historyWindow !== null && !historyWindow.isDestroyed()
}
