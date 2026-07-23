// ====================================================
// PromptForge AI — System Tray
// ====================================================

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { APP_NAME } from '../../shared/constants'
import { PersonaService } from '../../services/db/personaService'
import type { DatabaseWrapper } from '../../services/db/database'

let tray: Tray | null = null
let cachedMainWindow: BrowserWindow | null = null
let cachedDb: DatabaseWrapper | null = null

export function setupTray(mainWindow: BrowserWindow, db: DatabaseWrapper): void {
  cachedMainWindow = mainWindow
  cachedDb = db

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

  buildAndSetMenu()

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

/**
 * Rebuild the tray context menu (including the dynamic Persona submenu) and
 * refresh the tray tooltip to reflect the current active persona. Call this
 * after any persona CRUD/setDefault operation so the tray stays in sync.
 */
export function refreshPersonaMenu(): void {
  buildAndSetMenu()
}

function buildAndSetMenu(): void {
  if (!tray || !cachedMainWindow || !cachedDb) return

  const mainWindow = cachedMainWindow
  const personaService = new PersonaService(cachedDb)

  let personas: ReturnType<PersonaService['getAll']> = []
  try {
    personas = personaService.getAll()
  } catch {
    // Personas table may not exist yet (pre-migration) — tray still works, just no submenu items
    personas = []
  }

  const activePersona = personas.find((p) => p.isDefault)
  tray.setToolTip(activePersona ? `${APP_NAME} — ${activePersona.name}` : APP_NAME)

  const personaMenuItems: Electron.MenuItemConstructorOptions[] = personas.map((persona) => ({
    label: persona.name,
    type: 'radio',
    checked: persona.isDefault,
    click: () => {
      personaService.setDefault(persona.id)
      refreshPersonaMenu()
    }
  }))

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
    ...(personaMenuItems.length > 0
      ? [
          {
            label: 'Persona',
            submenu: personaMenuItems
          } as Electron.MenuItemConstructorOptions,
          { type: 'separator' as const }
        ]
      : []),
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
}

function createFallbackIcon(): Electron.NativeImage {
  // Create a 16x16 blue square as fallback icon
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    canvas[i * 4] = 59 // R
    canvas[i * 4 + 1] = 130 // G
    canvas[i * 4 + 2] = 246 // B
    canvas[i * 4 + 3] = 255 // A
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
  cachedMainWindow = null
  cachedDb = null
}
