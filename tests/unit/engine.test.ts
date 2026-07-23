// ====================================================
// PromptForge AI — Prompt Engine Unit Tests
// ====================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PromptEngine } from '../../src/services/prompt/engine'
import { ProviderRouter } from '../../src/services/ai/router'
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
        streamWithFallback: vi.fn().mockImplementation(async function* (
          _userPrompt: string,
          _systemPrompt: string,
          _options: unknown,
          _preferredProvider: unknown,
          onFallback?: (info: { usedFallback: boolean; fallbackReason?: string }) => void
        ) {
          void onFallback
          yield { text: 'Streamed ', done: false, provider: 'groq' }
          yield { text: 'prompt', done: false, provider: 'groq' }
          yield { text: '', done: true, provider: 'groq' }
          return {
            text: 'Streamed prompt',
            tokensUsed: 42,
            latencyMs: 88,
            provider: 'groq',
            model: 'llama-3.1-8b-instant'
          }
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

describe('PromptEngine Persona Injection', () => {
  let capturedSystemPrompt: string | undefined

  beforeEach(() => {
    capturedSystemPrompt = undefined

    // Override completeWithFallback to capture the systemPrompt it was called with
    vi.mocked(ProviderRouter).mockImplementation(
      () =>
        ({
          completeWithFallback: vi
            .fn()
            .mockImplementation((_userPrompt: string, systemPrompt: string) => {
              capturedSystemPrompt = systemPrompt
              return Promise.resolve({
                text: 'Result',
                tokensUsed: 10,
                latencyMs: 5,
                provider: 'groq',
                model: 'llama-3.1-8b-instant'
              })
            }),
          streamWithFallback: vi.fn(),
          checkAllHealth: vi.fn(),
          listModels: vi.fn(),
          registerProvider: vi.fn()
        }) as unknown as ProviderRouter
    )
  })

  afterEach(() => {
    // Restore the module-level default mock implementation (streaming-capable)
    // so it doesn't leak into other describe blocks in this file.
    vi.mocked(ProviderRouter).mockImplementation(() => {
      return {
        completeWithFallback: vi.fn().mockResolvedValue({
          text: 'Enhanced prompt from mock provider',
          tokensUsed: 150,
          latencyMs: 120,
          provider: 'groq',
          model: 'llama-3.1-8b-instant'
        }),
        streamWithFallback: vi.fn().mockImplementation(async function* (
          _userPrompt: string,
          _systemPrompt: string,
          _options: unknown,
          _preferredProvider: unknown,
          onFallback?: (info: { usedFallback: boolean; fallbackReason?: string }) => void
        ) {
          void onFallback
          yield { text: 'Streamed ', done: false, provider: 'groq' }
          yield { text: 'prompt', done: false, provider: 'groq' }
          yield { text: '', done: true, provider: 'groq' }
          return {
            text: 'Streamed prompt',
            tokensUsed: 42,
            latencyMs: 88,
            provider: 'groq',
            model: 'llama-3.1-8b-instant'
          }
        }),
        checkAllHealth: vi.fn(),
        listModels: vi.fn(),
        registerProvider: vi.fn()
      } as unknown as ProviderRouter
    })
  })

  function buildMockDb(options: {
    defaultPersona?: { system_prompt_injection: string } | undefined
    templateRow?:
      | { system_prompt: string; user_prompt_template: string; persona_override_allowed: number }
      | undefined
  }): DatabaseWrapper {
    return {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        get: vi.fn().mockImplementation(() => {
          if (sql.includes('FROM templates')) return options.templateRow
          if (sql.includes('FROM personas')) return options.defaultPersona
          return undefined
        })
      })),
      exec: vi.fn(),
      pragma: vi.fn(),
      transaction: vi.fn(),
      save: vi.fn(),
      close: vi.fn(),
      raw: {} as any
    } as unknown as DatabaseWrapper
  }

  it('should compose [persona] + separator + [mode system prompt] when a default persona is set and no template opts out', async () => {
    const mockDb = buildMockDb({
      defaultPersona: { system_prompt_injection: 'You are a meticulous QA engineer.' }
    })
    const engine = new PromptEngine(mockDb)
    await engine.enhance('some input', 'enhance')

    expect(capturedSystemPrompt).toContain('You are a meticulous QA engineer.')
    expect(capturedSystemPrompt).toContain('\n\n---\n\n')
    // The mode's built-in system prompt should still be present after the separator
    expect(capturedSystemPrompt).toContain('expert prompt engineer')
    // Persona block must come BEFORE the separator/task prompt (outer identity frame)
    expect(capturedSystemPrompt!.indexOf('QA engineer')).toBeLessThan(
      capturedSystemPrompt!.indexOf('---')
    )
  })

  it('should NOT inject persona when no default persona is set (byte-identical V1 behavior)', async () => {
    const mockDb = buildMockDb({ defaultPersona: undefined })
    const engine = new PromptEngine(mockDb)
    await engine.enhance('some input', 'enhance')

    expect(capturedSystemPrompt).not.toContain('---')
    expect(capturedSystemPrompt).toContain('expert prompt engineer')
  })

  it('should NOT inject persona when the selected template has persona_override_allowed = 0', async () => {
    const mockDb = buildMockDb({
      defaultPersona: { system_prompt_injection: 'You are a meticulous QA engineer.' },
      templateRow: {
        system_prompt: 'Custom template system prompt',
        user_prompt_template: '{{input}}',
        persona_override_allowed: 0
      }
    })
    const engine = new PromptEngine(mockDb)
    await engine.enhance('some input', 'enhance', { templateId: 'abc123' })

    expect(capturedSystemPrompt).toBe('Custom template system prompt')
    expect(capturedSystemPrompt).not.toContain('QA engineer')
  })

  it('should inject persona when the selected template allows overrides (persona_override_allowed = 1)', async () => {
    const mockDb = buildMockDb({
      defaultPersona: { system_prompt_injection: 'You are a meticulous QA engineer.' },
      templateRow: {
        system_prompt: 'Custom template system prompt',
        user_prompt_template: '{{input}}',
        persona_override_allowed: 1
      }
    })
    const engine = new PromptEngine(mockDb)
    await engine.enhance('some input', 'enhance', { templateId: 'abc123' })

    expect(capturedSystemPrompt).toContain('QA engineer')
    expect(capturedSystemPrompt).toContain('Custom template system prompt')
    expect(capturedSystemPrompt).toContain('\n\n---\n\n')
  })
})

describe('PromptEngine.enhanceStream', () => {
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

  it('should yield incremental chunks and return a final EngineResult', async () => {
    const engine = new PromptEngine(mockDb)
    const gen = engine.enhanceStream('write a calculator app', 'enhance')

    const chunks: { text: string; done: boolean; isFallback: boolean }[] = []
    let next = await gen.next()
    while (!next.done) {
      chunks.push(next.value)
      next = await gen.next()
    }
    const result = next.value

    expect(chunks.map((c) => c.text).join('')).toBe('Streamed prompt')
    expect(chunks[chunks.length - 1].done).toBe(true)
    expect(chunks.every((c) => c.isFallback === false)).toBe(true)

    expect(result.text).toBe('Streamed prompt')
    expect(result.provider).toBe('groq')
    expect(result.historyId).toBe('mock-history-id')
    expect(result.usedStreamFallback).toBe(false)
  })

  it('should mark chunks as fallback when the router reports a stream fallback', async () => {
    const { ProviderRouter } = await import('../../src/services/ai/router')
    ;(ProviderRouter as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      completeWithFallback: vi.fn(),
      streamWithFallback: vi.fn().mockImplementation(async function* (
        _userPrompt: string,
        _systemPrompt: string,
        _options: unknown,
        _preferredProvider: unknown,
        onFallback?: (info: { usedFallback: boolean; fallbackReason?: string }) => void
      ) {
        onFallback?.({ usedFallback: true, fallbackReason: 'Streaming unavailable' })
        yield { text: 'Full fallback result', done: true, provider: 'ollama' }
        return {
          text: 'Full fallback result',
          tokensUsed: 10,
          latencyMs: 5,
          provider: 'ollama',
          model: 'llama3.1'
        }
      }),
      checkAllHealth: vi.fn(),
      listModels: vi.fn(),
      registerProvider: vi.fn()
    }))

    const engine = new PromptEngine(mockDb)
    const gen = engine.enhanceStream('write a calculator app', 'enhance')

    const chunks: { text: string; done: boolean; isFallback: boolean }[] = []
    let next = await gen.next()
    while (!next.done) {
      chunks.push(next.value)
      next = await gen.next()
    }
    const result = next.value

    expect(chunks[0].isFallback).toBe(true)
    expect(result.usedStreamFallback).toBe(true)
    expect(result.text).toBe('Full fallback result')
  })
})
