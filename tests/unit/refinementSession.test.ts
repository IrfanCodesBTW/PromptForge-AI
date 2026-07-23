// ====================================================
// PromptForge AI — Refinement Session Unit Tests
// ====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  RefinementSession,
  RefinementSessionManager,
  refinementSessionManager
} from '../../src/services/refinementSession'
import {
  refinementStartSchema,
  refinementInstructionSchema,
  refinementSessionIdSchema
} from '../../src/shared/schemas/refinement'
import type { DatabaseWrapper } from '../../src/services/db/database'

// Mock ProviderRouter & PersonaService used inside RefinementSession
vi.mock('../../src/services/ai/router', () => {
  return {
    ProviderRouter: vi.fn().mockImplementation(() => ({
      streamWithFallback: vi.fn().mockImplementation(async function* () {
        yield { text: 'Refined prompt result: ', done: false, provider: 'ollama' }
        yield { text: 'make it clear and concise.', done: true, provider: 'ollama' }
        return {
          text: 'Refined prompt result: make it clear and concise.',
          tokensUsed: 12,
          latencyMs: 150,
          provider: 'ollama',
          model: 'llama3.1'
        }
      })
    }))
  }
})

vi.mock('../../src/services/db/personaService', () => {
  return {
    PersonaService: vi.fn().mockImplementation(() => ({
      getDefault: vi.fn().mockReturnValue({
        id: '11111111111111111111111111111111',
        name: 'Developer',
        systemPromptInjection: 'You are a senior software architect.',
        tone: 'technical',
        isDefault: true,
        isBuiltin: true
      })
    }))
  }
})

describe('Refinement Zod Schemas', () => {
  it('validates a valid refinementStart payload', () => {
    const payload = {
      originalText: 'Original text to enhance',
      currentOutput: 'Enhanced output version 1',
      mode: 'enhance',
      provider: 'ollama'
    }
    const result = refinementStartSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects empty originalText in refinementStart payload', () => {
    const payload = {
      originalText: '',
      currentOutput: 'Enhanced output'
    }
    const result = refinementStartSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('validates a valid refinementInstruction payload', () => {
    const payload = {
      sessionId: '1234567890abcdef1234567890abcdef',
      instruction: 'Make it more professional and add bullet points.'
    }
    const result = refinementInstructionSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('validates refinementSessionId schema', () => {
    const payload = { sessionId: 'session-id-123' }
    const result = refinementSessionIdSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })
})

describe('RefinementSessionManager', () => {
  let manager: RefinementSessionManager
  const mockDb = {} as DatabaseWrapper

  beforeEach(() => {
    manager = new RefinementSessionManager()
  })

  it('creates and retrieves active sessions', () => {
    const session = manager.createSession(mockDb, {
      originalText: 'Original prompt text',
      currentOutput: 'Enhanced output v1'
    })

    expect(session.sessionId).toBeDefined()
    expect(session.originalText).toBe('Original prompt text')
    expect(session.currentOutput).toBe('Enhanced output v1')

    const retrieved = manager.getSession(session.sessionId, 5)
    expect(retrieved).toBe(session)
    expect(manager.activeCount()).toBe(1)
  })

  it('ends an active session', () => {
    const session = manager.createSession(mockDb, {
      originalText: 'Text',
      currentOutput: 'Output'
    })

    const ended = manager.endSession(session.sessionId)
    expect(ended).toBe(true)
    expect(manager.getSession(session.sessionId)).toBeUndefined()
    expect(manager.activeCount()).toBe(0)
  })

  it('detects and purges expired sessions based on inactivity timeout', () => {
    const session = manager.createSession(mockDb, {
      originalText: 'Text',
      currentOutput: 'Output'
    })

    // Artificially set lastActiveAt 10 minutes into the past
    session.lastActiveAt = Date.now() - 10 * 60 * 1000

    expect(session.isExpired(5)).toBe(true)

    // Retrieval should prune the expired session
    const retrieved = manager.getSession(session.sessionId, 5)
    expect(retrieved).toBeUndefined()

    // Explicit clean call
    const session2 = manager.createSession(mockDb, {
      originalText: 'Text 2',
      currentOutput: 'Output 2'
    })
    session2.lastActiveAt = Date.now() - 15 * 60 * 1000

    const cleaned = manager.cleanExpiredSessions(5)
    expect(cleaned).toBe(1)
  })

  it('uses the export singleton refinementSessionManager', () => {
    const session = refinementSessionManager.createSession(mockDb, {
      originalText: 'Singleton text',
      currentOutput: 'Singleton output'
    })
    expect(refinementSessionManager.getSession(session.sessionId)).toBe(session)
    refinementSessionManager.endSession(session.sessionId)
  })
})

describe('RefinementSession Execution', () => {
  const mockDb = {} as DatabaseWrapper

  it('streams refinement chunks and records completed turn', async () => {
    const session = new RefinementSession(mockDb, {
      originalText: 'Write a python script to fetch data',
      currentOutput: 'Create a Python script using requests to fetch API data.'
    })

    const chunks: string[] = []
    const gen = session.refine('Add error handling for HTTP 500 status codes.')

    let next = await gen.next()
    while (!next.done) {
      chunks.push(next.value.text)
      next = await gen.next()
    }

    const result = next.value

    expect(chunks.length).toBe(2)
    expect(result.text).toBe('Refined prompt result: make it clear and concise.')
    expect(session.currentOutput).toBe('Refined prompt result: make it clear and concise.')
    expect(session.turns.length).toBe(1)
    expect(session.turns[0].instruction).toBe('Add error handling for HTTP 500 status codes.')
    expect(session.turns[0].output).toBe('Refined prompt result: make it clear and concise.')
  })
})
