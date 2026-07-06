// ====================================================
// PromptForge AI — Clipboard Writer
// ====================================================
// Writes enhanced text to clipboard and optionally auto-pastes.

import { clipboard } from 'electron'
import { sleep } from '../../shared/utils'

/**
 * Write text to the system clipboard
 */
export async function writeToClipboard(text: string): Promise<void> {
  clipboard.writeText(text)
}

/**
 * Write text to clipboard and simulate paste (Ctrl+V)
 */
export async function writeAndPaste(text: string): Promise<void> {
  clipboard.writeText(text)

  // Short delay to ensure clipboard is written
  await sleep(100)

  // Simulate Ctrl+V / Cmd+V based on OS
  const { exec } = await import('child_process')
  const platform = process.platform

  await new Promise<void>((resolve) => {
    let command = ''
    if (platform === 'win32') {
      command =
        'powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"'
    } else if (platform === 'darwin') {
      command = `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
    } else if (platform === 'linux') {
      command = 'xdotool key ctrl+v'
    }

    if (command) {
      exec(command, (error) => {
        if (error) {
          console.warn(`[Clipboard] Paste simulation error on ${platform}:`, error.message)
        }
        resolve()
      })
    } else {
      resolve()
    }
  })
}
