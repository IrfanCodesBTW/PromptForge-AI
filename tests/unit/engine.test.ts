// ====================================================
// PromptForge AI — Prompt Engine Unit Tests
// ====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromptEngine } from '../../src/services/prompt/engine'
import type { DatabaseWrapper } from '../../src/services/db/database'

// Mock services
vi.mock('../../src/services/ai/router', () => {
  return {
    ProviderRouter: vi.fn().mockImplementation(() => {
      return {
        completeWithFallback: vi.fn().mockResolvedValue({
          text: 'Enhanced prompt from mock provider',
          tokensUsed: 150,
          latencyMs: 120,
          provider: 'groq',
          model: 'llama-3.1-8b-instant'
        }),
        checkAllHealth: vi.fn(),
        listModels: vi.fn(),
        registerProvider: vi.fn()
      }
    })
  }
})

vi.mock('../../src/services/db/history', () => {
  return {
    HistoryService: vi.fn().mockImplementation(() => {
      return {
        create: vi.fn().mockReturnValue('mock-history-id')
      }
    })
  }
})

describe('PromptEngine', () => {
  let mockDb: DatabaseWrapper

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      }),
      exec: vi.fn(),
      pragma: vi.fn(),
      transaction: vi.fn(),
      save: vi.fn(),
      close: vi.fn(),
      raw: {} as any
    } as unknown as DatabaseWrapper
  })

  it('should interpolate input text into template', async () => {
    const engine = new PromptEngine(mockDb)
    const result = await engine.enhance('write a calculator app', 'enhance')

    expect(result.text).toBe('Enhanced prompt from mock provider')
    expect(result.provider).toBe('groq')
    expect(result.model).toBe('llama-3.1-8b-instant')
    expect(result.historyId).toBe('mock-history-id')
  })

  it('should fallback to built-in prompts if template is not found in database', async () => {
    const engine = new PromptEngine(mockDb)
    const result = await engine.enhance('compress this text', 'compress')

    expect(result.text).toBe('Enhanced prompt from mock provider')
  })
})
