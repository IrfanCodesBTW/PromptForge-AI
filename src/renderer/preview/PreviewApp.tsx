// ====================================================
// PromptForge AI — Floating Preview Window App
// ====================================================
// Standalone renderer bundle supporting live streaming preview and
// multi-turn refinement conversation loop.

import { useCallback, useEffect, useRef, useState } from 'react'
import { IPC_CHANNELS } from '../../shared/constants'
import type {
  PreviewTokenChunkPayload,
  PreviewStreamDonePayload,
  PreviewStreamErrorPayload,
  PreviewSourceTextPayload,
  RefinementTurn,
  RefinementTokenChunkPayload,
  RefinementDonePayload,
  RefinementErrorPayload
} from '../../shared/types'
import { Logo } from '../src/components/ui/Logo'

type StreamState = 'streaming' | 'done' | 'error'

export function PreviewApp(): JSX.Element {
  const [text, setText] = useState('')
  const [state, setState] = useState<StreamState>('streaming')
  const [provider, setProvider] = useState('')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Refinement loop state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [turns, setTurns] = useState<RefinementTurn[]>([])
  const [instructionInput, setInstructionInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [refiningText, setRefiningText] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Holds the original selected text sent by HotkeyManager before the stream
  // starts. Used as `originalText` when starting a refinement session so the
  // session has the correct source context (not the enhanced output).
  const sourceTextRef = useRef<string>('')

  // Listen to initial stream events
  useEffect(() => {
    // Capture the original selected text before streaming begins
    const unsubSourceText = window.api.on(
      IPC_CHANNELS.PREVIEW_SOURCE_TEXT,
      (...args: unknown[]) => {
        const payload = args[0] as PreviewSourceTextPayload
        sourceTextRef.current = payload.sourceText
      }
    )

    const unsubChunk = window.api.on(IPC_CHANNELS.PREVIEW_TOKEN_CHUNK, (...args: unknown[]) => {
      const payload = args[0] as PreviewTokenChunkPayload
      setText((prev) => prev + payload.text)
      setProvider(payload.provider)
      if (payload.isFallback) setIsFallback(true)
    })

    const unsubDone = window.api.on(IPC_CHANNELS.PREVIEW_STREAM_DONE, (...args: unknown[]) => {
      const payload = args[0] as PreviewStreamDonePayload
      setState('done')
      setProvider(payload.provider)
      setLatencyMs(payload.latencyMs)
      if (payload.usedStreamFallback) setIsFallback(true)
      setText(payload.enhanced)
    })

    const unsubError = window.api.on(IPC_CHANNELS.PREVIEW_STREAM_ERROR, (...args: unknown[]) => {
      const payload = args[0] as PreviewStreamErrorPayload
      setState('error')
      setErrorMessage(payload.message)
    })

    return () => {
      unsubSourceText()
      unsubChunk()
      unsubDone()
      unsubError()
    }
  }, [])

  // Listen to refinement stream events
  useEffect(() => {
    const unsubRefineChunk = window.api.on(
      IPC_CHANNELS.REFINEMENT_TOKEN_CHUNK,
      (...args: unknown[]) => {
        const payload = args[0] as RefinementTokenChunkPayload
        setRefiningText((prev) => prev + payload.text)
      }
    )

    const unsubRefineDone = window.api.on(IPC_CHANNELS.REFINEMENT_DONE, (...args: unknown[]) => {
      const payload = args[0] as RefinementDonePayload
      setIsRefining(false)
      setText(payload.enhanced)
      setLatencyMs(payload.latencyMs)
      if (payload.usedStreamFallback) setIsFallback(true)

      // Store finished turn
      setTurns((prev) => [
        ...prev,
        {
          instruction: instructionInput,
          output: payload.enhanced,
          timestamp: new Date().toISOString()
        }
      ])
      setInstructionInput('')
      setRefiningText('')
    })

    const unsubRefineError = window.api.on(IPC_CHANNELS.REFINEMENT_ERROR, (...args: unknown[]) => {
      const payload = args[0] as RefinementErrorPayload
      setIsRefining(false)
      setState('error')
      setErrorMessage(payload.message)
    })

    return () => {
      unsubRefineChunk()
      unsubRefineDone()
      unsubRefineError()
    }
  }, [instructionInput])

  // Initialize refinement session when initial stream finishes
  useEffect(() => {
    if (state === 'done' && !sessionId && text) {
      void (async () => {
        try {
          // Use the source text captured from PREVIEW_SOURCE_TEXT as originalText.
          // Fall back to the enhanced text only if we never received the source text
          // (e.g. session was started from HistoryPickerApp's "Use as Base" flow).
          const originalText = sourceTextRef.current || text
          const res = (await window.api.invoke(IPC_CHANNELS.REFINEMENT_START, {
            originalText,
            currentOutput: text
          })) as { sessionId: string }
          if (res?.sessionId) {
            setSessionId(res.sessionId)
          }
        } catch {
          // Ignore if start fails (session-less fallback)
        }
      })()
    }
  }, [state, sessionId, text])

  // Auto-scroll to bottom as new tokens/turns arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, turns, refiningText])

  // Auto-focus input when initial stream completes
  useEffect(() => {
    if (state === 'done' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state])

  const accept = useCallback(() => {
    if (sessionId) {
      void window.api.invoke(IPC_CHANNELS.REFINEMENT_END_SESSION, { sessionId })
    }
    void window.api.invoke(IPC_CHANNELS.PREVIEW_ACCEPT)
  }, [sessionId])

  const reject = useCallback(() => {
    if (sessionId) {
      void window.api.invoke(IPC_CHANNELS.REFINEMENT_END_SESSION, { sessionId })
    }
    void window.api.invoke(IPC_CHANNELS.PREVIEW_REJECT)
  }, [sessionId])

  const rerun = useCallback(() => {
    if (sessionId) {
      void window.api.invoke(IPC_CHANNELS.REFINEMENT_END_SESSION, { sessionId })
    }
    setSessionId(null)
    setTurns([])
    setText('')
    setState('streaming')
    setIsFallback(false)
    setErrorMessage('')
    setIsRefining(false)
    setRefiningText('')
    void window.api.invoke(IPC_CHANNELS.PREVIEW_RERUN)
  }, [sessionId])

  const handleSendInstruction = useCallback(() => {
    if (!instructionInput.trim() || isRefining || !sessionId) return

    setIsRefining(true)
    setRefiningText('')

    void window.api.invoke(IPC_CHANNELS.REFINEMENT_SEND_INSTRUCTION, {
      sessionId,
      instruction: instructionInput.trim()
    })
  }, [instructionInput, isRefining, sessionId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        reject()
      } else if (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        rerun()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reject, rerun])

  return (
    <div
      className="w-[420px] max-h-[420px] flex flex-col rounded-md border border-border shadow-popup overflow-hidden"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, transparent)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-md py-sm border-b border-border shrink-0">
        <div className="flex items-center gap-xs">
          <Logo size={16} />
          <span className="inline-flex items-center gap-xs rounded-full bg-pill-bg px-sm py-xs text-xs font-mono text-text-secondary">
            {provider || '...'}
            {latencyMs !== null && <span className="text-text-muted">· {latencyMs}ms</span>}
          </span>
          {turns.length > 0 && (
            <span className="text-xs text-primary font-mono font-medium px-xs py-0.5 rounded bg-primary/10">
              Turn {turns.length + 1}
            </span>
          )}
        </div>
        {isFallback && state !== 'error' && (
          <span className="text-xs text-text-muted">
            Streaming unavailable — displaying completed response
          </span>
        )}
      </header>

      {/* Main content scroll area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-md py-sm font-mono text-sm text-text-primary whitespace-pre-wrap flex flex-col gap-sm"
      >
        {state === 'error' ? (
          <div className="text-error">
            <p className="font-medium">Enhancement failed</p>
            <p className="text-xs mt-xs">{errorMessage}</p>
          </div>
        ) : (
          <>
            {/* Multi-turn history thread */}
            {turns.map((turn, i) => (
              <div
                key={i}
                className="flex flex-col gap-xs text-xs border-b border-border/50 pb-xs mb-xs"
              >
                <div className="text-primary font-medium flex items-center gap-xs">
                  <span>💬 User instruction:</span>
                  <span className="text-text-primary italic">{turn.instruction}</span>
                </div>
                <div className="text-text-secondary pl-sm border-l-2 border-primary/30">
                  {turn.output}
                </div>
              </div>
            ))}

            {/* Current latest output or refining stream */}
            <div>
              {isRefining ? (
                <>
                  <div className="text-xs text-primary font-medium mb-xs">
                    Refining with instruction: &quot;{instructionInput}&quot;
                  </div>
                  <div>
                    {refiningText}
                    <span className="inline-block w-2 h-4 ml-px bg-primary animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  {text}
                  {state === 'streaming' && (
                    <span className="inline-block w-2 h-4 ml-px bg-primary animate-pulse" />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Refinement Chat Input Bar (only shown when stream is ready and no error) */}
      {state === 'done' && (
        <div className="px-md py-xs border-t border-border bg-surface-card/40 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendInstruction()
            }}
            className="flex items-center gap-xs"
          >
            <input
              ref={inputRef}
              type="text"
              value={instructionInput}
              onChange={(e) => setInstructionInput(e.target.value)}
              placeholder="Refine further… (Enter to send)"
              disabled={isRefining}
              className="flex-1 h-[36px] px-sm text-xs font-mono bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!instructionInput.trim() || isRefining}
              className="h-[36px] px-sm rounded-sm text-xs bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Footer controls */}
      <footer className="flex items-center justify-end gap-sm px-md py-sm border-t border-border shrink-0">
        {state === 'error' ? (
          <button
            onClick={rerun}
            className="px-md py-xs rounded-sm text-sm bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Retry
          </button>
        ) : (
          <>
            <button
              onClick={reject}
              className="px-md py-xs rounded-sm text-sm text-text-secondary hover:bg-surface-card-hover transition-colors cursor-pointer"
              title="Escape"
            >
              Reject
            </button>
            <button
              onClick={rerun}
              className="px-md py-xs rounded-sm text-sm text-text-secondary hover:bg-surface-card-hover transition-colors cursor-pointer"
              title="Ctrl+R"
            >
              Re-run
            </button>
            <button
              onClick={accept}
              disabled={state !== 'done' || isRefining}
              className="px-md py-xs rounded-sm text-sm bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Accept refined output"
            >
              Accept
            </button>
          </>
        )}
      </footer>
    </div>
  )
}
