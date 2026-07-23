import { Minus, Square, X } from 'lucide-react'
import { Logo } from '../ui/Logo'

export function Titlebar(): JSX.Element {
  return (
    <div className="titlebar-drag h-9 bg-surface flex items-center justify-between border-b border-border select-none">
      <div className="flex items-center gap-sm px-lg">
        <Logo size={18} />
        <span className="text-sm font-bold text-text-primary tracking-tight">
          PromptForge <span className="text-[#8B5CF6]">AI</span>
        </span>
        <span className="text-[10px] font-semibold text-text-muted px-1.5 py-0.5 rounded bg-surface-card-hover border border-border/50">
          v1.5.0
        </span>
      </div>
      <div className="titlebar-no-drag flex items-center h-full">
        <button
          className="h-full px-md hover:bg-surface-card-hover transition-colors text-text-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => window.api?.invoke('promptforge:window:toggle', { action: 'minimize' })}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="h-full px-md hover:bg-surface-card-hover transition-colors text-text-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => window.api?.invoke('promptforge:window:toggle', { action: 'maximize' })}
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          className="h-full px-md hover:bg-error hover:text-white transition-colors text-text-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error focus-visible:outline-none"
          onClick={() => window.api?.invoke('promptforge:window:toggle', { action: 'close' })}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
