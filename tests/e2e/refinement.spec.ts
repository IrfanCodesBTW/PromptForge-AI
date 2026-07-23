// ====================================================
// PromptForge AI — Refinement Loop E2E Test
// ====================================================
// Exercises the preview window's multi-turn refinement UI, chat input bar,
// and Accept flow end-to-end against the real PreviewApp renderer.

import { test, expect } from '@playwright/test'
import * as path from 'path'
import { existsSync } from 'fs'
import { createServer, type Server } from 'http'
import { readFile } from 'fs/promises'

declare global {
  interface Window {
    __invocations?: { channel: string; args: unknown[] }[]
    api?: {
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      emitMockEvent: (channel: string, payload: unknown) => void
    }
  }
}

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

test.describe('Floating Preview Window — Multi-Turn Refinement Flow', () => {
  test.beforeAll(async () => {
    if (!existsSync(PREVIEW_HTML_PATH)) return

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

  test('displays refinement input bar and allows submitting follow-up instructions', async ({
    page
  }) => {
    if (!existsSync(PREVIEW_HTML_PATH)) {
      test.skip()
      return
    }

    // Pre-inject mock `window.api` bridge before document load
    await page.addInitScript(() => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
      const invocations: { channel: string; args: unknown[] }[] = []

      window.__invocations = invocations

      window.api = {
        on: (channel: string, callback: (...args: unknown[]) => void) => {
          if (!listeners[channel]) listeners[channel] = []
          listeners[channel].push(callback)
          return () => {
            listeners[channel] = listeners[channel].filter((cb) => cb !== callback)
          }
        },
        invoke: (channel: string, ...args: unknown[]) => {
          invocations.push({ channel, args })
          if (channel === 'promptforge:refinement:start') {
            return Promise.resolve({ sessionId: 'mock-session-id-123' })
          }
          if (channel === 'promptforge:refinement:send-instruction') {
            // Simulate async refinement streaming response
            setTimeout(() => {
              const doneCbs = listeners['promptforge:refinement:done'] || []
              doneCbs.forEach((cb) =>
                cb({
                  sessionId: 'mock-session-id-123',
                  enhanced: 'Refined version with error handling included.',
                  provider: 'ollama',
                  model: 'llama3.1',
                  tokensUsed: 20,
                  latencyMs: 100,
                  usedStreamFallback: false
                })
              )
            }, 50)
            return Promise.resolve({ success: true })
          }
          return Promise.resolve(null)
        },
        emitMockEvent: (channel: string, payload: unknown) => {
          const cbs = listeners[channel] || []
          cbs.forEach((cb) => cb(payload))
        }
      }
    })

    await page.goto(`${baseUrl}/preview/index.html`)

    // Simulate initial stream completion
    await page.evaluate(() => {
      window.api?.emitMockEvent('promptforge:preview:stream-done', {
        enhanced: 'Initial enhanced output prompt',
        provider: 'ollama',
        model: 'llama3.1',
        tokensUsed: 15,
        latencyMs: 80,
        historyId: 'h1',
        usedStreamFallback: false
      })
    })

    // Input bar should appear once initial stream completes
    const input = page.locator('input[placeholder="Refine further… (Enter to send)"]')
    await expect(input).toBeVisible()

    // Type instruction and click Send
    await input.fill('Add error handling')
    await page.click('button:has-text("Send")')

    // Expect refined text to appear in thread
    await expect(page.locator('text=Refined version with error handling included.')).toBeVisible()
    await expect(page.locator('text=User instruction:')).toBeVisible()

    // Accept refined output
    await page.click('button:has-text("Accept")')

    // Verify REFINEMENT_END_SESSION and PREVIEW_ACCEPT were invoked
    const invocations = await page.evaluate(() => {
      return window.__invocations || []
    })

    const channelNames = invocations.map((i: { channel: string }) => i.channel)
    expect(channelNames).toContain('promptforge:refinement:end-session')
    expect(channelNames).toContain('promptforge:preview:accept')
  })
})
