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

  // Simulate Ctrl+C
  // For MVP we use PowerShell to simulate keypress on Windows
  const { exec } = await import('child_process')
  await new Promise<void>((resolve) => {
    exec(
      'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"',
      () => resolve()
    )
  })

  // Wait for clipboard to update
  await sleep(150)

  // Read the selected text
  const selectedText = clipboard.readText()

  // Restore original clipboard
  if (selectedText && selectedText.length > 0) {
    // We have selected text — keep it for now, restore after enhancement
    return selectedText
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
