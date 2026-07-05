// ====================================================
// PromptForge AI — Electron Main Process Entry
// ====================================================

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupTray } from './tray/tray'
import { HotkeyManager } from './hotkeys/manager'
import { registerIpcHandlers } from './ipc/handlers'
import { initDatabaseAsync } from '../services/db/database'
import { APP_NAME } from '../shared/constants'

let mainWindow: BrowserWindow | null = null
let hotkeyManager: HotkeyManager | null = null

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 640,
    minHeight: 480,
    show: false,
    title: APP_NAME,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0F1419',
      symbolColor: '#F1F5F9',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.promptforge.ai')

  // Watch for shortcut creation on install
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  const db = await initDatabaseAsync()

  // Register IPC handlers
  registerIpcHandlers(db)

  // Create main window
  mainWindow = createMainWindow()

  // Setup system tray
  setupTray(mainWindow)

  // Initialize hotkey manager
  hotkeyManager = new HotkeyManager(db, mainWindow)
  hotkeyManager.registerAll()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Unregister all hotkeys
  if (hotkeyManager) {
    hotkeyManager.unregisterAll()
  }
})
