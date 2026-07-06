// ====================================================
// PromptForge AI — Clipboard Reader
// ====================================================
// Captures selected text from any application by simulating copy.

import { clipboard } from 'electron'
import { sleep } from '../../shared/utils'

/**
 * Read the currently selected text from any application.
 *
 * Strategy:
 * 1. Save the current clipboard contents
 * 2. Simulate Ctrl+C to copy the selection
 * 3. Read the new clipboard contents (selected text)
 * 4. Restore the original clipboard
 *
 * Returns the selected text, or null if nothing was selected.
 */
export async function readClipboardSelection(): Promise<string | null> {
  // Save current clipboard
  const savedClipboard = clipboard.readText()

  // Clear clipboard to detect if copy actually works
  clipboard.writeText('')

  // Simulate Ctrl+C / Cmd+C based on OS
  const { exec } = await import('child_process')
  const platform = process.platform

  await new Promise<void>((resolve) => {
    let command = ''
    if (platform === 'win32') {
      command =
        'powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"'
    } else if (platform === 'darwin') {
      command = `osascript -e 'tell application "System Events" to keystroke "c" using command down'`
    } else if (platform === 'linux') {
      command = 'xdotool key ctrl+c || xclip -o -selection primary'
    }

    if (command) {
      exec(command, (error) => {
        if (error) {
          console.warn(`[Clipboard] Copy simulation error on ${platform}:`, error.message)
        }
        resolve()
      })
    } else {
      resolve()
    }
  })

  // Wait for clipboard to update
  await sleep(150)

  // Read the selected text
  const selectedText = clipboard.readText()

  // Restore original clipboard
  if (selectedText && selectedText.trim().length > 0) {
    // We have selected text — keep it for now, restore after enhancement
    return selectedText
  }

  // Under Linux, let's try reading primary selection directly as a fallback if clipboard was empty
  if (platform === 'linux') {
    try {
      const primaryText = await new Promise<string>((resolvePrimary) => {
        exec('xclip -o -selection primary', (error, stdout) => {
          if (!error && stdout) {
            resolvePrimary(stdout.toString())
          } else {
            resolvePrimary('')
          }
        })
      })
      if (primaryText && primaryText.trim().length > 0) {
        return primaryText
      }
    } catch {
      // Ignore fallback failure
    }
  }

  // No text was selected, restore clipboard
  clipboard.writeText(savedClipboard)
  return null
}

/**
 * Read current clipboard text without simulating copy
 */
export function readClipboard(): string {
  return clipboard.readText()
}
