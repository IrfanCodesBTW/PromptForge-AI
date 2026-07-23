// ====================================================
// PromptForge AI — Side-by-Side Diff Component
// ====================================================
// Computes a word-level diff client-side using the `diff` npm package.
// Additions highlighted via --color-success-highlight, deletions via
// --color-error-highlight.

import { diffWords } from 'diff'

interface DiffViewProps {
  originalText: string
  enhancedText: string
}

export function DiffView({ originalText, enhancedText }: DiffViewProps): JSX.Element {
  const changes = diffWords(originalText, enhancedText)

  return (
    <div className="grid grid-cols-2 gap-sm text-xs font-mono">
      <div className="bg-surface border border-border rounded-sm p-sm overflow-y-auto max-h-40">
        <p className="text-text-muted mb-xs font-sans">Original</p>
        {changes.map((part, i) =>
          part.added ? null : (
            <span key={i} className={part.removed ? 'bg-error-highlight' : undefined}>
              {part.value}
            </span>
          )
        )}
      </div>
      <div className="bg-surface border border-border rounded-sm p-sm overflow-y-auto max-h-40">
        <p className="text-text-muted mb-xs font-sans">Enhanced</p>
        {changes.map((part, i) =>
          part.removed ? null : (
            <span key={i} className={part.added ? 'bg-success-highlight' : undefined}>
              {part.value}
            </span>
          )
        )}
      </div>
    </div>
  )
}
