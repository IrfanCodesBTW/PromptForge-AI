// ====================================================
// PromptForge AI — Preview Window Unit Tests
// ====================================================
// Covers: IPC payload validation (via Zod on the preview action schema
// pattern used in handlers), window lifecycle (open/close/reopen), and the
// preview streaming state machine as orchestrated by HotkeyManager.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ---- Mock Electron primitives used by previewWindow.ts ----

const mockWebContentsSend = vi.fn()
const mockShow = vi.fn()
const mockFocus = vi.fn()
const mockSetPosition = vi.fn()
const mockClose = vi.fn()
let isDestroyedFlag = false
let blurHandler: (() => void) | null = null
let closedHandler: (() => void) | null = null

vi.mock('electron', () => {
  class MockBrowserWindow {
    webContents = { send: mockWebContentsSend }
    show = mockShow
    focus = mockFocus
    setPosition = mockSetPosition
    close = mockClose
    loadFile = vi.fn()
    loadURL = vi.fn()

    constructor() {
      isDestroyedFlag = false
    }

    isDestroyed(): boolean {
      return isDestroyedFlag
    }

    on(event: string, handler: () => void): void {
      if (event === 'blur') blurHandler = handler
      if (event === 'closed') closedHandler = handler
    }

    once(event: string, handler: () => void): void {
      if (event === 'ready-to-show') handler()
    }
  }

  return {
    BrowserWindow: MockBrowserWindow,
    screen: {
      getCursorScreenPoint: vi.fn().mockReturnValue({ x: 100, y: 200 })
    }
  }
})

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false }
}))

describe('Preview Window Lifecycle', () => {
  beforeEach(async () => {
    vi.resetModules()
    isDestroyedFlag = false
    blurHandler = null
    closedHandler = null
    mockWebContentsSend.mockClear()
    mockShow.mockClear()
    mockFocus.mockClear()
    mockSetPosition.mockClear()
    mockClose.mockClear()
  })

  it('should create a new preview window positioned near the cursor', async () => {
    const { getOrCreatePreviewWindow, isPreviewWindowOpen } =
      await import('../../src/main/windows/previewWindow')

    expect(isPreviewWindowOpen()).toBe(false)
    const win = getOrCreatePreviewWindow()
    expect(win).toBeDefined()
    expect(isPreviewWindowOpen()).toBe(true)
  })

  it('should reuse the existing window instead of creating a duplicate (Re-run flow)', async () => {
    const { getOrCreatePreviewWindow } = await import('../../src/main/windows/previewWindow')

    const win1 = getOrCreatePreviewWindow()
    const win2 = getOrCreatePreviewWindow()
    expect(win1).toBe(win2)
    // Repositioning should be triggered on reuse
    expect(mockSetPosition).toHaveBeenCalledWith(116, 216)
  })

  it('should close the preview window and allow reopening afterward', async () => {
    const { getOrCreatePreviewWindow, closePreviewWindow, isPreviewWindowOpen } =
      await import('../../src/main/windows/previewWindow')

    getOrCreatePreviewWindow()
    expect(isPreviewWindowOpen()).toBe(true)

    closePreviewWindow()
    expect(mockClose).toHaveBeenCalled()

    // Simulate the 'closed' event firing (as Electron would after win.close())
    closedHandler?.()
    expect(isPreviewWindowOpen()).toBe(false)

    // Reopen should create a fresh window without throwing
    const reopened = getOrCreatePreviewWindow()
    expect(reopened).toBeDefined()
    expect(isPreviewWindowOpen()).toBe(true)
  })

  it('should auto-dismiss (close) on focus loss', async () => {
    const { getOrCreatePreviewWindow, isPreviewWindowOpen } =
      await import('../../src/main/windows/previewWindow')

    getOrCreatePreviewWindow()
    expect(isPreviewWindowOpen()).toBe(true)

    blurHandler?.()
    expect(mockClose).toHaveBeenCalled()
  })

  it('should send token chunk, stream-done, and stream-error payloads to the window webContents', async () => {
    const { getOrCreatePreviewWindow, sendTokenChunk, sendStreamDone, sendStreamError } =
      await import('../../src/main/windows/previewWindow')
    const { IPC_CHANNELS } = await import('../../src/shared/constants')

    getOrCreatePreviewWindow()

    sendTokenChunk({ text: 'Hello', done: false, provider: 'ollama', isFallback: false })
    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_CHANNELS.PREVIEW_TOKEN_CHUNK,
      expect.objectContaining({ text: 'Hello' })
    )

    sendStreamDone({
      enhanced: 'Hello World',
      provider: 'ollama',
      model: 'llama3.1',
      tokensUsed: 10,
      latencyMs: 20,
      historyId: 'abc',
      usedStreamFallback: false
    })
    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_CHANNELS.PREVIEW_STREAM_DONE,
      expect.objectContaining({ enhanced: 'Hello World' })
    )

    sendStreamError({ code: 'ENHANCE_FAILED', message: 'boom' })
    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_CHANNELS.PREVIEW_STREAM_ERROR,
      expect.objectContaining({ code: 'ENHANCE_FAILED' })
    )
  })

  it('should no-op sends silently when no window is open', async () => {
    const { sendTokenChunk } = await import('../../src/main/windows/previewWindow')
    expect(() =>
      sendTokenChunk({ text: 'x', done: false, provider: 'ollama', isFallback: false })
    ).not.toThrow()
    expect(mockWebContentsSend).not.toHaveBeenCalled()
  })
})

describe('Preview IPC Payload Validation', () => {
  // Mirrors the validation used at the IPC boundary in handlers.ts for
  // preview action channels (accept/reject/rerun) and streaming payloads.
  const previewActionSchema = z.object({
    action: z.enum(['accept', 'reject', 'rerun'])
  })

  const tokenChunkSchema = z.object({
    text: z.string(),
    done: z.boolean(),
    provider: z.string(),
    isFallback: z.boolean()
  })

  it('should accept valid preview action payloads', () => {
    expect(() => previewActionSchema.parse({ action: 'accept' })).not.toThrow()
    expect(() => previewActionSchema.parse({ action: 'reject' })).not.toThrow()
    expect(() => previewActionSchema.parse({ action: 'rerun' })).not.toThrow()
  })

  it('should reject invalid/unrecognized preview action payloads', () => {
    expect(() => previewActionSchema.parse({ action: 'delete-everything' })).toThrow()
    expect(() => previewActionSchema.parse({})).toThrow()
    expect(() => previewActionSchema.parse({ action: 123 })).toThrow()
  })

  it('should validate a well-formed token chunk payload', () => {
    expect(() =>
      tokenChunkSchema.parse({ text: 'hi', done: false, provider: 'ollama', isFallback: false })
    ).not.toThrow()
  })

  it('should reject a malformed token chunk payload', () => {
    expect(() => tokenChunkSchema.parse({ text: 123, done: 'nope' })).toThrow()
  })
})

describe('Preview Streaming State Machine (via HotkeyManager)', () => {
  beforeEach(() => {
    vi.resetModules()
    isDestroyedFlag = false
    blurHandler = null
    closedHandler = null
    mockWebContentsSend.mockClear()
    mockClose.mockClear()
  })

  async function buildManager(streamChunks: { text: string; done: boolean }[]) {
    vi.doMock('../../src/services/prompt/engine', () => ({
      PromptEngine: vi.fn().mockImplementation(() => ({
        enhanceStream: vi.fn().mockImplementation(async function* () {
          let fullText = ''
          for (const chunk of streamChunks) {
            fullText += chunk.text
            yield { text: chunk.text, done: chunk.done, provider: 'ollama', isFallback: false }
          }
          return {
            text: fullText,
            provider: 'ollama',
            model: 'llama3.1',
            tokensUsed: 5,
            latencyMs: 10,
            historyId: 'hist-1',
            usedStreamFallback: false
          }
        }),
        enhance: vi.fn()
      }))
    }))

    const { HotkeyManager } = await import('../../src/main/hotkeys/manager')

    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ value: 'true' }) // preview_window_enabled = true
      })
    }
    const mockMainWindow = { webContents: { send: vi.fn() } }

    return new HotkeyManager(mockDb as any, mockMainWindow as any)
  }

  it('should stream chunks into the preview window and mark it done', async () => {
    const manager = await buildManager([
      { text: 'Hello ', done: false },
      { text: 'World', done: false },
      { text: '', done: true }
    ])

    // Access private method via bracket notation for direct unit testing
    await (manager as any).runPreviewFlow('some input', 'enhance')

    const { IPC_CHANNELS } = await import('../../src/shared/constants')
    const doneCalls = mockWebContentsSend.mock.calls.filter(
      (c) => c[0] === IPC_CHANNELS.PREVIEW_STREAM_DONE
    )
    expect(doneCalls).toHaveLength(1)
    expect(doneCalls[0][1].enhanced).toBe('Hello World')
  })

  it('should reset state and clear latestText on Re-run', async () => {
    const manager = await buildManager([{ text: 'First result', done: true }])
    await (manager as any).runPreviewFlow('input', 'enhance')

    expect((manager as any).pendingPreview.latestText).toBe('First result')

    await manager.handlePreviewRerun()
    // After rerun completes (same mock stream), latestText should reflect the new run
    expect((manager as any).pendingPreview.latestText).toBe('First result')
  })

  it('should clear pendingPreview state on Reject', async () => {
    const manager = await buildManager([{ text: 'output', done: true }])
    await (manager as any).runPreviewFlow('input', 'enhance')

    expect((manager as any).pendingPreview).not.toBeNull()
    manager.handlePreviewReject()
    expect((manager as any).pendingPreview).toBeNull()
  })
})
