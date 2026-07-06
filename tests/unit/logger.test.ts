// ====================================================
// PromptForge AI — Structured Logger Unit Tests
// ====================================================

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'

const testDir = path.resolve(__dirname, '../../test-logger-userData')
let logger: any

describe('Structured Logger', () => {
  beforeAll(async () => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }

    // Set global mock electron app before importing logger
    const mockApp = { getPath: () => testDir }
    ;(global as any).__mock_electron_app__ = mockApp
    ;(globalThis as any).__mock_electron_app__ = mockApp

    // Dynamic import to prevent hoisting issues
    const mod = await import('../../src/shared/logger')
    logger = mod.logger
  })

  afterAll(() => {
    delete (global as any).__mock_electron_app__
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should print logs to the console and write to disk file', () => {
    console.log('--- LOGGER DIAGNOSTICS ---', {
      isMain: logger.isMain,
      logPath: logger.logPath,
      fs: !!(logger as any).fs,
      path: !!(logger as any).path,
      mockApp: (global as any).__mock_electron_app__
    })
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    logger.info('Hello logger info')
    logger.warn('Hello logger warn')
    logger.error('Hello logger error', new Error('Test log error'))

    expect(consoleSpy).toHaveBeenCalledTimes(3)
    consoleSpy.mockRestore()

    console.log('--- POST-LOG DIAGNOSTICS ---', {
      logPath: (logger as any).logPath
    })

    // Verify logs got written to disk
    const logFilePath = path.join(testDir, 'logs/app.log')
    expect(fs.existsSync(logFilePath)).toBe(true)
    
    const content = fs.readFileSync(logFilePath, 'utf8')
    expect(content).toContain('Hello logger info')
    expect(content).toContain('Hello logger warn')
    expect(content).toContain('Hello logger error')
    expect(content).toContain('Error: Test log error')
  })
})
