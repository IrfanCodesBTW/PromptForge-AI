// ====================================================
// PromptForge AI — System Tray
// ====================================================

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { APP_NAME } from '../../shared/constants'

let tray: Tray | null = null

export function setupTray(mainWindow: BrowserWindow): void {
  // Create a simple tray icon (16x16)
  // In production, use a proper icon from resources/
  const iconPath = join(__dirname, '../../../resources/icon.png')
  let icon: Electron.NativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    // Fallback: create a simple colored square icon
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon.isEmpty() ? createFallbackIcon() : icon)
  tray.setToolTip(APP_NAME)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '● PromptForge AI',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '⚡ Enhance (Ctrl+Shift+E)',
      click: () => {
        mainWindow.webContents.send('promptforge:hotkey:triggered', { action: 'enhance' })
      }
    },
    {
      label: '📐 Expand (Ctrl+Shift+X)',
      click: () => {
        mainWindow.webContents.send('promptforge:hotkey:triggered', { action: 'expand' })
      }
    },
    {
      label: '📦 Compress (Ctrl+Shift+K)',
      click: () => {
        mainWindow.webContents.send('promptforge:hotkey:triggered', { action: 'compress' })
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: 'History',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('promptforge:window:open', { window: 'history' })
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createFallbackIcon(): Electron.NativeImage {
  // Create a 16x16 blue square as fallback icon
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    canvas[i * 4] = 59      // R
    canvas[i * 4 + 1] = 130  // G
    canvas[i * 4 + 2] = 246  // B
    canvas[i * 4 + 3] = 255  // A
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
