// ====================================================
// PromptForge AI — History Picker Search → Re-copy E2E Test
// ====================================================
// Loads the history-picker renderer bundle directly in a Playwright page
// (mirrors tests/e2e/previewWindow.spec.ts's approach), injects a mock
// window.api bridge backed by an in-memory fixture, and exercises the
// search → re-copy flow end-to-end against the real HistoryPickerApp.

import { test, expect } from '@playwright/test'
import * as path from 'path'
import { existsSync } from 'fs'
import { createServer, type Server } from 'http'
import { readFile } from 'fs/promises'

const PICKER_DIR = path.join(__dirname, '../../out/renderer')
const PICKER_HTML_PATH = path.join(PICKER_DIR, 'history-picker/index.html')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css'
}

let server: Server
let baseUrl = ''

const fixtureEntries = [
  {
    id: '11111111111111111111111111111111',
    originalText: 'a rough draft about quantum computing',
    enhancedText: 'a polished explanation of quantum computing fundamentals',
    provider: 'ollama',
    model: 'llama3.1',
    category: 'enhancement',
    tokensUsed: 10,
    latencyMs: 20,
    isFavorite: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '22222222222222222222222222222222',
    originalText: 'notes about baking sourdough bread',
    enhancedText: 'a structured recipe for sourdough bread',
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    category: 'enhancement',
    tokensUsed: 8,
    latencyMs: 15,
    isFavorite: false,
    createdAt: new Date().toISOString()
  }
]

test.describe('History Picker Search to Re-copy Flow', () => {
  test.beforeAll(async () => {
    if (!existsSync(PICKER_HTML_PATH)) return

    server = createServer(async (req, res) => {
      const urlPath = (req.url || '/').split('?')[0]
      const filePath = path.join(PICKER_DIR, decodeURIComponent(urlPath))
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
    if (!existsSync(PICKER_HTML_PATH)) {
      test.skip(true, 'History picker renderer build output not found — run `npm run build` first')
      return
    }

    await page.addInitScript((entries) => {
      const invokeCalls: { channel: string; args: unknown[] }[] = []
      ;(window as any).__pickerTestInvokeCalls = invokeCalls

      ;(window as any).api = {
        invoke: (channel: string, ...args: unknown[]) => {
          invokeCalls.push({ channel, args })

          if (channel === 'promptforge:history:recent') {
            const opts = args[0] as { limit: number; query?: string }
            const q = (opts?.query || '').toLowerCase().trim()
            const filtered = q
              ? entries.filter(
                  (e: any) =>
                    e.originalText.toLowerCase().includes(q) ||
                    e.enhancedText.toLowerCase().includes(q)
                )
              : entries
            return Promise.resolve(filtered)
          }
          if (channel === 'promptforge:history:recopy') {
            return Promise.resolve(true)
          }
          return Promise.resolve(null)
        },
        on: () => () => {},
        send: () => {}
      }
    }, fixtureEntries)

    await page.goto(`${baseUrl}/history-picker/index.html`)
  })

  test('should show all entries initially, then filter down to a match on search', async ({
    page
  }) => {
    await expect(page.getByText('quantum computing fundamentals').first()).toBeVisible()
    await expect(page.getByText('sourdough bread', { exact: false }).first()).toBeVisible()

    const searchInput = page.getByPlaceholder('Search history…')
    await searchInput.fill('sourdough')

    // Debounce is 150ms; wait for the filtered result to appear and the
    // non-matching one to disappear.
    await expect(page.getByText('sourdough bread', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('quantum computing fundamentals').first()).not.toBeVisible({
      timeout: 3000
    })
  })

  test('should invoke history:recopy when clicking the Re-copy button on an entry', async ({
    page
  }) => {
    const recopyButtons = page.getByRole('button', { name: 'Re-copy' })
    await recopyButtons.first().click()

    const calls = await page.evaluate(() => (window as any).__pickerTestInvokeCalls)
    expect(calls).toContainEqual(expect.objectContaining({ channel: 'promptforge:history:recopy' }))

    // Toast should appear confirming the copy
    await expect(page.getByText('Copied!')).toBeVisible()
  })

  test('should invoke history:recopy when pressing Enter on the focused entry', async ({
    page
  }) => {
    await expect(page.getByText('quantum computing fundamentals').first()).toBeVisible()

    await page.keyboard.press('Enter')

    const calls = await page.evaluate(() => (window as any).__pickerTestInvokeCalls)
    const recopyCalls = calls.filter((c: any) => c.channel === 'promptforge:history:recopy')
    expect(recopyCalls.length).toBeGreaterThan(0)
  })
})
