import { Minus, Square, X } from 'lucide-react'
import { APP_NAME } from '../../../../shared/constants'

export function Titlebar(): JSX.Element {
  return (
    <div className="titlebar-drag h-9 bg-surface flex items-center justify-between border-b border-border select-none">
      <div className="flex items-center gap-sm px-lg">
        <span className="text-sm font-semibold text-text-primary">{APP_NAME}</span>
        <span className="text-xs text-text-muted">v1.0.0</span>
      </div>
      <div className="titlebar-no-drag flex items-center h-full">
        <button
          className="h-full px-md hover:bg-surface-elevated transition-colors text-text-secondary hover:text-text-primary"
          onClick={() => window.api?.invoke('promptforge:window:toggle', { action: 'minimize' })}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="h-full px-md hover:bg-surface-elevated transition-colors text-text-secondary hover:text-text-primary"
          onClick={() => window.api?.invoke('promptforge:window:toggle', { action: 'maximize' })}
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          className="h-full px-md hover:bg-error transition-colors text-text-secondary hover:text-white"
          onClick={() => window.api?.invoke('promptforge:app:quit')}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
