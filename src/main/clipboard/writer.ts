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

  // Simulate Ctrl+V
  // For MVP we use PowerShell on Windows
  const { exec } = await import('child_process')
  await new Promise<void>((resolve) => {
    exec(
      'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"',
      () => resolve()
    )
  })
}
