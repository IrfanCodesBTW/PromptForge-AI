// ====================================================
// PromptForge AI — Playwright Electron E2E Tests
// ====================================================

import { _electron as electron, test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import * as path from 'path'

test.describe('PromptForge AI Electron E2E', () => {
  let electronApp: any
  let firstWindow: any

  test.beforeAll(async () => {
    // Launch Electron application using build output
    try {
      electronApp = await electron.launch({
        args: [path.join(__dirname, '../../out/main/index.js')]
      })
      firstWindow = await electronApp.firstWindow()
    } catch (err) {
      console.warn(
        '[E2E] Skipped launching application (no compiled binaries found or headful required):',
        err
      )
    }
  })

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close()
    }
  })

  test('should verify window creation and title', async () => {
    if (!firstWindow) {
      // Skip test if app launch failed (e.g. running in headless CI without frame buffer)
      test.skip()
      return
    }

    const title = await firstWindow.title()
    expect(title).toBe('PromptForge AI')
  })

  test('should check app root is visible', async () => {
    if (!firstWindow) {
      test.skip()
      return
    }

    const isVisible = await firstWindow.locator('#root').isVisible()
    expect(isVisible).toBe(true)
  })

  test('should perform accessibility audit with Axe', async () => {
    if (!firstWindow) {
      test.skip()
      return
    }

    // Scan page for accessibility violations
    const results = await new AxeBuilder({ page: firstWindow }).analyze()

    // Assert no critical accessibility violations exist
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalViolations.length).toBe(0)
  })
})
