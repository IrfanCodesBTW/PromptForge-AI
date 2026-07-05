// ====================================================
// PromptForge AI — useIPC Hook
// ====================================================

import { useCallback, useEffect } from 'react'

/**
 * Type-safe wrapper for invoking IPC calls to the main process.
 */
export function useInvoke() {
  const invoke = useCallback(async <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return (await window.api.invoke(channel, ...args)) as T
  }, [])

  return invoke
}

/**
 * Subscribe to IPC events from the main process.
 * Automatically unsubscribes on unmount.
 */
export function useIPCEvent(channel: string, handler: (...args: unknown[]) => void): void {
  useEffect(() => {
    const unsubscribe = window.api.on(channel, handler)
    return unsubscribe
  }, [channel, handler])
}
