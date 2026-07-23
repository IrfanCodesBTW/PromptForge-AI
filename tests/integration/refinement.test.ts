// ====================================================
// PromptForge AI — Refinement Integration Test
// ====================================================
// Exercises multi-turn conversational refinement across 3 turns.

import { describe, it, expect, vi } from 'vitest'
import { RefinementSession } from '../../src/services/refinementSession'
import type { DatabaseWrapper } from '../../src/services/db/database'

let callCount = 0

vi.mock('../../src/services/ai/router', () => {
  return {
    ProviderRouter: vi.fn().mockImplementation(() => ({
      streamWithFallback: vi.fn().mockImplementation(async function* () {
        callCount++
        const turnText = `Turn ${callCount} refined output text`
        yield { text: turnText, done: true, provider: 'groq' }
        return {
          text: turnText,
          tokensUsed: 25,
          latencyMs: 120,
          provider: 'groq',
          model: 'llama-3.1-8b-instant'
        }
      })
    }))
  }
})

vi.mock('../../src/services/db/personaService', () => {
  return {
    PersonaService: vi.fn().mockImplementation(() => ({
      getDefault: vi.fn().mockReturnValue(null)
    }))
  }
})

describe('Refinement Session Integration (3-turn conversation)', () => {
  const mockDb = {} as DatabaseWrapper

  it('completes a 3-turn refinement conversation accumulating history turns', async () => {
    callCount = 0
    const session = new RefinementSession(mockDb, {
      originalText: 'Build a weather dashboard app',
      currentOutput: 'Develop a modern weather dashboard application using React and Tailwind CSS.'
    })

    expect(session.turns.length).toBe(0)

    // Turn 1
    const gen1 = session.refine('Add dark mode support.')
    let n1 = await gen1.next()
    while (!n1.done) n1 = await gen1.next()
    expect(n1.value.text).toBe('Turn 1 refined output text')
    expect(session.currentOutput).toBe('Turn 1 refined output text')
    expect(session.turns.length).toBe(1)

    // Turn 2
    const gen2 = session.refine('Include 7-day forecast component.')
    let n2 = await gen2.next()
    while (!n2.done) n2 = await gen2.next()
    expect(n2.value.text).toBe('Turn 2 refined output text')
    expect(session.currentOutput).toBe('Turn 2 refined output text')
    expect(session.turns.length).toBe(2)

    // Turn 3
    const gen3 = session.refine('Specify OpenWeatherMap API for fetching data.')
    let n3 = await gen3.next()
    while (!n3.done) n3 = await gen3.next()
    expect(n3.value.text).toBe('Turn 3 refined output text')
    expect(session.currentOutput).toBe('Turn 3 refined output text')
    expect(session.turns.length).toBe(3)

    // Verify history turns summary
    expect(session.turns[0].instruction).toBe('Add dark mode support.')
    expect(session.turns[1].instruction).toBe('Include 7-day forecast component.')
    expect(session.turns[2].instruction).toBe('Specify OpenWeatherMap API for fetching data.')
  })
})
