// ====================================================
// PromptForge AI — Refinement Session Service
// ====================================================
// In-memory multi-turn refinement session orchestrator.
// Allows users to iteratively refine an enhanced prompt via natural language instructions.

import type { DatabaseWrapper } from './db/database'
import { ProviderRouter } from './ai/router'
import { PersonaService } from './db/personaService'
import { cleanLLMResponse, type EngineResult, type EnhanceStreamChunk } from './prompt/engine'
import { generateId, now } from '../shared/utils'
import type { EnhanceMode, RefinementTurn } from '../shared/types'

export interface RefinementSessionConfig {
  originalText: string
  currentOutput: string
  mode?: EnhanceMode
  templateId?: string
  provider?: string
  model?: string
}

export class RefinementSession {
  public readonly sessionId: string
  public readonly originalText: string
  public currentOutput: string
  public readonly mode: EnhanceMode
  public readonly templateId?: string
  public readonly provider?: string
  public readonly model?: string
  public readonly turns: RefinementTurn[] = []
  public lastActiveAt: number

  private db: DatabaseWrapper
  private router: ProviderRouter
  private personas: PersonaService
  private isProcessing = false

  constructor(db: DatabaseWrapper, config: RefinementSessionConfig) {
    this.sessionId = generateId()
    this.originalText = config.originalText
    this.currentOutput = config.currentOutput
    this.mode = config.mode || 'enhance'
    this.templateId = config.templateId
    this.provider = config.provider
    this.model = config.model
    this.lastActiveAt = Date.now()

    this.db = db
    this.router = new ProviderRouter(db)
    this.personas = new PersonaService(db)
  }

  /**
   * Touch the session to update its last-active timestamp.
   */
  public touch(): void {
    this.lastActiveAt = Date.now()
  }

  /**
   * Check if the session has expired given a timeout in minutes.
   */
  public isExpired(timeoutMinutes: number): boolean {
    const timeoutMs = timeoutMinutes * 60 * 1000
    return Date.now() - this.lastActiveAt > timeoutMs
  }

  /**
   * Refine the prompt with a new user instruction.
   * Yields stream chunks as tokens arrive, returning the final EngineResult.
   */
  public async *refine(
    instruction: string
  ): AsyncGenerator<EnhanceStreamChunk, EngineResult, void> {
    if (this.isProcessing) {
      throw new Error('Session is currently processing another instruction')
    }

    this.isProcessing = true
    this.touch()

    try {
      console.log(`[RefinementSession:${this.sessionId}] Processing instruction: "${instruction}"`)

      const { systemPrompt, userPrompt } = this.buildRefinementPrompts(instruction)

      let usedFallback = false
      const streamGen = this.router.streamWithFallback(
        userPrompt,
        systemPrompt,
        {
          model: this.model,
          temperature: 0.7,
          maxTokens: 2048
        },
        this.provider,
        (info) => {
          usedFallback = info.usedFallback
          if (info.usedFallback) {
            console.warn(
              `[RefinementSession:${this.sessionId}] Stream fallback triggered: ${info.fallbackReason}`
            )
          }
        }
      )

      let fullText = ''
      let next = await streamGen.next()
      while (!next.done) {
        const chunk = next.value
        fullText += chunk.text
        yield {
          text: chunk.text,
          done: chunk.done,
          provider: chunk.provider,
          isFallback: usedFallback
        }
        next = await streamGen.next()
      }

      const routerResult = next.value
      const cleanedText = cleanLLMResponse(routerResult.text || fullText)

      // Record this refinement turn
      const turn: RefinementTurn = {
        instruction,
        output: cleanedText,
        timestamp: now()
      }
      this.turns.push(turn)
      this.currentOutput = cleanedText
      this.touch()

      console.log(
        `[RefinementSession:${this.sessionId}] Refine completed (turn ${this.turns.length})`
      )

      return {
        text: cleanedText,
        provider: routerResult.provider,
        model: routerResult.model,
        tokensUsed: routerResult.tokensUsed,
        latencyMs: routerResult.latencyMs,
        usedStreamFallback: usedFallback
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Build sub-800 token system & user prompts for the multi-turn refinement turn.
   */
  private buildRefinementPrompts(instruction: string): {
    systemPrompt: string
    userPrompt: string
  } {
    let baseSystemPrompt =
      'You are an expert AI prompt engineer assisting in a multi-turn prompt refinement session.\n' +
      'Your task is to refine and update the prompt output based on the user’s specific request.\n' +
      'CRITICAL REQUIREMENT: Return ONLY the refined prompt text. Do NOT include conversational intros, explanations, or surrounding markdown codeblocks.'

    // Persona injection
    try {
      const persona = this.personas.getDefault()
      if (persona) {
        baseSystemPrompt = `${persona.systemPromptInjection}\n\n---\n\n${baseSystemPrompt}`
      }
    } catch {
      // Ignore if persona service fails or is uninitialized
    }

    // Build context thread
    let promptContent = `--- ORIGINAL USER PROMPT ---\n${this.originalText}\n\n`
    promptContent += `--- CURRENT ENHANCED PROMPT ---\n${this.currentOutput}\n\n`

    if (this.turns.length > 0) {
      promptContent += `--- REFINEMENT HISTORY ---\n`
      for (const turn of this.turns) {
        promptContent += `User instruction: ${turn.instruction}\n`
        promptContent += `Updated prompt: ${turn.output}\n\n`
      }
    }

    promptContent += `--- NEW USER REFINEMENT INSTRUCTION ---\n${instruction}\n\n`
    promptContent += `Please produce the updated refined prompt incorporating the instruction above:`

    return {
      systemPrompt: baseSystemPrompt,
      userPrompt: promptContent
    }
  }
}

/**
 * In-memory Manager for Refinement Sessions
 */
export class RefinementSessionManager {
  private sessions: Map<string, RefinementSession> = new Map()

  /**
   * Create a new refinement session.
   */
  public createSession(db: DatabaseWrapper, config: RefinementSessionConfig): RefinementSession {
    const session = new RefinementSession(db, config)
    this.sessions.set(session.sessionId, session)
    console.log(`[RefinementSessionManager] Created session ${session.sessionId}`)
    return session
  }

  /**
   * Retrieve an active session by ID. Returns undefined if not found or expired.
   */
  public getSession(sessionId: string, timeoutMinutes: number = 5): RefinementSession | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined

    if (session.isExpired(timeoutMinutes)) {
      console.log(`[RefinementSessionManager] Session ${sessionId} expired; removing`)
      this.sessions.delete(sessionId)
      return undefined
    }

    session.touch()
    return session
  }

  /**
   * End and remove a session by ID.
   */
  public endSession(sessionId: string): boolean {
    const existed = this.sessions.has(sessionId)
    if (existed) {
      this.sessions.delete(sessionId)
      console.log(`[RefinementSessionManager] Ended session ${sessionId}`)
    }
    return existed
  }

  /**
   * Purge all expired sessions. Returns count of purged sessions.
   */
  public cleanExpiredSessions(timeoutMinutes: number = 5): number {
    let count = 0
    for (const [id, session] of this.sessions.entries()) {
      if (session.isExpired(timeoutMinutes)) {
        this.sessions.delete(id)
        count++
      }
    }
    if (count > 0) {
      console.log(`[RefinementSessionManager] Cleaned ${count} expired session(s)`)
    }
    return count
  }

  /**
   * Total number of active sessions (useful for tests/monitoring).
   */
  public activeCount(): number {
    return this.sessions.size
  }

  /**
   * Clear all sessions (for test teardown).
   */
  public clearAll(): void {
    this.sessions.clear()
  }
}

// Export singleton instance for app-wide use
export const refinementSessionManager = new RefinementSessionManager()
