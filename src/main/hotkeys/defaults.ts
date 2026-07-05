// ====================================================
// PromptForge AI — Default Hotkey Bindings
// ====================================================

import type { EnhanceMode } from '@shared/types'

export interface HotkeyDefinition {
  action: string
  accelerator: string
  mode?: EnhanceMode
  description: string
}

export const DEFAULT_HOTKEY_BINDINGS: HotkeyDefinition[] = [
  {
    action: 'enhance',
    accelerator: 'Ctrl+Shift+E',
    mode: 'enhance',
    description: 'Enhance selected text'
  },
  {
    action: 'expand',
    accelerator: 'Ctrl+Shift+X',
    mode: 'expand',
    description: 'Expand selected text'
  },
  {
    action: 'compress',
    accelerator: 'Ctrl+Shift+K',
    mode: 'compress',
    description: 'Compress selected text'
  }
]
