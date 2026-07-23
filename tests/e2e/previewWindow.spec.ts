// ====================================================
// PromptForge AI — Preview Window Accept/Reject E2E Test
// ====================================================
// Loads the preview window's renderer bundle directly in a Playwright page
// (rather than driving global hotkeys, which aren't reliably simulatable),
// injects a mock `window.api` bridge, and exercises the Accept/Reject/Re-run
// UI + keyboard flow end-to-end against the real PreviewApp component.

import { test, expect } from '@playwright/test'
import * as path from 'path'
import { existsSync } from 'fs'
import { createServer, type Server } from 'http'
import { readFile } from 'fs/promises'

const PREVIEW_DIR = path.join(__dirname, '../../out/renderer')
const PREVIEW_HTML_PATH = path.join(PREVIEW_DIR, 'preview/index.html')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
}

let server: Server
let baseUrl = ''

test.describe('Preview Window Accept/Reject Flow', () => {
  test.beforeAll(async () => {
    if (!existsSync(PREVIEW_HTML_PATH)) return

    // Serve the built renderer output over http:// — loading module scripts
    // directly via file:// hits Chromium's opaque-origin CORS restriction on
    // cross-file ES module imports, which doesn't reflect how Electron's
    // custom file protocol actually behaves in the real app.
    server = createServer(async (req, res) => {
      const urlPath = (req.url || '/').split('?')[0]
      const filePath = path.join(PREVIEW_DIR, decodeURIComponent(urlPath))
      try {
        const data = await readFile(filePath)
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve())
    })
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    baseUrl = `http://127.0.0.1:${port}`
  })

  test.afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  test.beforeEach(async ({ page }) => {
    if (!existsSync(PREVIEW_HTML_PATH)) {
      test.skip(true, 'Preview renderer build output not found — run `npm run build` first')
      return
    }

    // Inject a mock window.api bridge before any app script runs, mirroring
    // the shape exposed by src/preload/index.ts's contextBridge.
    await page.addInitScript(() => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
      const invokeCalls: { channel: string; args: unknown[] }[] = []

      ;(window as any).__previewTestInvokeCalls = invokeCalls
      ;(window as any).__previewTestEmit = (channel: string, payload: unknown) => {
        const cbs = listeners[channel] || []
        cbs.forEach((cb) => cb(payload))
      }

      ;(window as any).api = {
        invoke: (channel: string, ...args: unknown[]) => {
          invokeCalls.push({ channel, args })
          return Promise.resolve()
        },
        on: (channel: string, callback: (...args: unknown[]) => void) => {
          listeners[channel] = listeners[channel] || []
          listeners[channel].push(callback)
          return () => {
            listeners[channel] = (listeners[channel] || []).filter((cb) => cb !== callback)
          }
        },
        send: () => {}
      }
    })

    await page.goto(`${baseUrl}/preview/index.html`)
  })

  test('should stream tokens, enable Accept once done, and invoke preview:accept on click', async ({
    page
  }) => {
    // Simulate the main process streaming chunks
    await page.evaluate(() => {
      const emit = (window as any).__previewTestEmit
      emit('promptforge:preview:token-chunk', {
        text: 'Hello ',
        done: false,
        provider: 'ollama',
        isFallback: false
      })
      emit('promptforge:preview:token-chunk', {
        text: 'World',
        done: false,
        provider: 'ollama',
        isFallback: false
      })
    })

    await expect(page.getByText('Hello World', { exact: false })).toBeVisible()

    // Accept button should be disabled while streaming
    const acceptButton = page.getByRole('button', { name: 'Accept' })
    await expect(acceptButton).toBeDisabled()

    // Simulate stream completion
    await page.evaluate(() => {
      const emit = (window as any).__previewTestEmit
      emit('promptforge:preview:stream-done', {
        enhanced: 'Hello World',
        provider: 'ollama',
        model: 'llama3.1',
        tokensUsed: 5,
        latencyMs: 42,
        historyId: 'hist-1',
        usedStreamFallback: false
      })
    })

    await expect(acceptButton).toBeEnabled()
    await acceptButton.click()

    const calls = await page.evaluate(() => (window as any).__previewTestInvokeCalls)
    expect(calls).toContainEqual(expect.objectContaining({ channel: 'promptforge:preview:accept' }))
  })

  test('should invoke preview:reject when Escape is pressed', async ({ page }) => {
    await page.evaluate(() => {
      const emit = (window as any).__previewTestEmit
      emit('promptforge:preview:stream-done', {
        enhanced: 'Some result',
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        tokensUsed: 3,
        latencyMs: 10,
        historyId: 'hist-2',
        usedStreamFallback: false
      })
    })

    await page.keyboard.press('Escape')

    const calls = await page.evaluate(() => (window as any).__previewTestInvokeCalls)
    expect(calls).toContainEqual(expect.objectContaining({ channel: 'promptforge:preview:reject' }))
  })

  test('should invoke preview:rerun when Ctrl+R is pressed and reset displayed text', async ({
    page
  }) => {
    await page.evaluate(() => {
      const emit = (window as any).__previewTestEmit
      emit('promptforge:preview:token-chunk', {
        text: 'Initial output',
        done: false,
        provider: 'ollama',
        isFallback: false
      })
    })
    await expect(page.getByText('Initial output', { exact: false })).toBeVisible()

    await page.keyboard.press('Control+r')

    const calls = await page.evaluate(() => (window as any).__previewTestInvokeCalls)
    expect(calls).toContainEqual(expect.objectContaining({ channel: 'promptforge:preview:rerun' }))

    // Text should be cleared after triggering re-run
    await expect(page.getByText('Initial output', { exact: false })).not.toBeVisible()
  })

  test('should show fallback notice and render full result when streaming falls back', async ({
    page
  }) => {
    await page.evaluate(() => {
      const emit = (window as any).__previewTestEmit
      emit('promptforge:preview:stream-done', {
        enhanced: 'Fallback completed result',
        provider: 'ollama',
        model: 'llama3.1',
        tokensUsed: 8,
        latencyMs: 15,
        historyId: 'hist-3',
        usedStreamFallback: true
      })
    })

    await expect(page.getByText('Streaming unavailable', { exact: false })).toBeVisible()
    await expect(page.getByText('Fallback completed result', { exact: false })).toBeVisible()
  })
})
