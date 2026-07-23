// ====================================================
// PromptForge AI — Prompt Engine
// ====================================================
// Main orchestrator: input → template → provider → result → history.

import type { DatabaseWrapper } from '../db/database'
import { ProviderRouter } from '../ai/router'
import { getSystemPrompt, getUserPromptTemplate } from './enhancer'
import { HistoryService } from '../db/history'
import { PersonaService } from '../db/personaService'
import type { EnhanceMode } from '../../shared/types'

export interface EngineResult {
  text: string
  provider: string
  model: string
  tokensUsed: number
  latencyMs: number
  historyId?: string
  /** True if streaming was requested but the engine had to fall back to a non-streaming completion */
  usedStreamFallback?: boolean
}

export interface EnhanceStreamChunk {
  /** Incremental text fragment */
  text: string
  /** True on the final chunk */
  done: boolean
  /** Provider that produced this chunk */
  provider: string
  /** True if this stream is a hybrid-fallback (non-streaming) result delivered as a single chunk */
  isFallback: boolean
}

export class PromptEngine {
  private db: DatabaseWrapper
  private router: ProviderRouter
  private history: HistoryService
  private personas: PersonaService

  constructor(db: DatabaseWrapper) {
    this.db = db
    this.router = new ProviderRouter(db)
    this.history = new HistoryService(db)
    this.personas = new PersonaService(db)
  }

  /**
   * Enhance text using the specified mode.
   * This is the core pipeline:
   * 1. Get system prompt for the mode
   * 2. Build user prompt from template + input
   * 3. Send to AI provider (with fallback)
   * 4. Log to history
   * 5. Return result
   */
  async enhance(
    input: string,
    mode: EnhanceMode,
    options?: {
      provider?: string
      model?: string
      temperature?: number
      maxTokens?: number
      templateId?: string
    }
  ): Promise<EngineResult> {
    console.log(`[Engine] Enhancing with mode: ${mode}`)

    const { systemPrompt, userPrompt } = this.buildPrompts(input, mode, options?.templateId)

    // Step 3: Call AI provider
    const result = await this.router.completeWithFallback(
      userPrompt,
      systemPrompt,
      {
        model: options?.model,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048
      },
      options?.provider
    )

    // Clean LLM response from conversational fluff and surrounding quotes
    result.text = cleanLLMResponse(result.text)

    // Step 4: Save to history
    let historyId: string | undefined
    try {
      historyId = this.history.create({
        originalText: input,
        enhancedText: result.text,
        provider: result.provider,
        model: result.model,
        templateId: options?.templateId,
        category: this.categorizeMode(mode),
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs
      })
    } catch (error) {
      console.warn('[Engine] Failed to save history:', error)
    }

    console.log(
      `[Engine] Done: ${result.provider}/${result.model} in ${result.latencyMs}ms (${result.tokensUsed} tokens)`
    )

    return {
      text: result.text,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      historyId
    }
  }

  /**
   * Streaming variant of enhance(). Mirrors the same prompt-building and
   * history-logging behavior, but yields incremental EnhanceStreamChunk
   * objects as they arrive instead of resolving a single promise.
   *
   * Hybrid fallback: if the selected provider doesn't support streaming or
   * the stream fails mid-flight, this transparently falls back to a
   * non-streaming complete() call and yields the full result as a single
   * chunk with isFallback: true — callers should treat this as a normal
   * (non-error) completion path and may display a subtle "streaming
   * unavailable" notice.
   *
   * The final EngineResult is returned via the generator's return value
   * (available to callers using `for await` + checking the generator's
   * final `.return()`, or by exhausting the iterator manually).
   */
  async *enhanceStream(
    input: string,
    mode: EnhanceMode,
    options?: {
      provider?: string
      model?: string
      temperature?: number
      maxTokens?: number
      templateId?: string
    }
  ): AsyncGenerator<EnhanceStreamChunk, EngineResult, void> {
    console.log(`[Engine] Enhancing (stream) with mode: ${mode}`)

    const { systemPrompt, userPrompt } = this.buildPrompts(input, mode, options?.templateId)

    let usedFallback = false

    const streamGen = this.router.streamWithFallback(
      userPrompt,
      systemPrompt,
      {
        model: options?.model,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048
      },
      options?.provider,
      (info) => {
        usedFallback = info.usedFallback
        if (info.usedFallback) {
          console.warn(`[Engine] Stream fallback triggered: ${info.fallbackReason}`)
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

    const result = next.value

    // Clean LLM response from conversational fluff and surrounding quotes
    result.text = cleanLLMResponse(result.text || fullText)

    // Save to history — identical to enhance()
    let historyId: string | undefined
    try {
      historyId = this.history.create({
        originalText: input,
        enhancedText: result.text,
        provider: result.provider,
        model: result.model,
        templateId: options?.templateId,
        category: this.categorizeMode(mode),
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs
      })
    } catch (error) {
      console.warn('[Engine] Failed to save history:', error)
    }

    console.log(
      `[Engine] Stream done: ${result.provider}/${result.model} in ${result.latencyMs}ms (${result.tokensUsed} tokens)${usedFallback ? ' [fallback]' : ''}`
    )

    return {
      text: result.text,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      historyId,
      usedStreamFallback: usedFallback
    }
  }

  /**
   * Shared prompt-building logic used by both enhance() and enhanceStream().
   * Loads a custom template from the DB if templateId is provided, otherwise
   * uses the built-in system/user prompt templates for the given mode.
   *
   * Persona injection: if a default persona is set AND the selected
   * template/mode allows persona overrides (persona_override_allowed != 0),
   * the persona's system_prompt_injection is prepended as an outer
   * identity/tone frame, separated from the task-specific system prompt by
   * a '---' divider: [persona] \n\n---\n\n [template/mode system prompt].
   * If no persona is set, or the template opts out, behavior is byte-identical
   * to V1 (no persona block at all).
   */
  private buildPrompts(
    input: string,
    mode: EnhanceMode,
    templateId?: string
  ): { systemPrompt: string; userPrompt: string } {
    let systemPrompt = getSystemPrompt(mode)
    let userPromptTemplate = getUserPromptTemplate(mode)
    let personaOverrideAllowed = true

    if (templateId) {
      try {
        const row = this.db
          .prepare(
            'SELECT system_prompt, user_prompt_template, persona_override_allowed FROM templates WHERE id = ? AND is_active = 1'
          )
          .get(templateId) as
          | {
              system_prompt: string
              user_prompt_template: string
              persona_override_allowed: number | null
            }
          | undefined

        if (row) {
          systemPrompt = row.system_prompt
          userPromptTemplate = row.user_prompt_template
          // Built-in templates seeded before Phase 3 have this explicitly
          // set to 0; new/custom templates default to 1 (column default).
          personaOverrideAllowed = row.persona_override_allowed !== 0
          console.log(`[Engine] Loaded custom template: ${templateId}`)
        }
      } catch (error) {
        console.warn(
          `[Engine] Failed to load custom template ${templateId}, using defaults:`,
          error
        )
      }
    }

    if (personaOverrideAllowed) {
      try {
        const persona = this.personas.getDefault()
        if (persona) {
          systemPrompt = `${persona.systemPromptInjection}\n\n---\n\n${systemPrompt}`
        }
      } catch (error) {
        // Personas table may not exist yet (pre-migration) or query failed —
        // fall back to V1 behavior (no persona block) rather than breaking enhancement.
        console.warn('[Engine] Failed to load default persona, continuing without it:', error)
      }
    }

    const userPrompt = userPromptTemplate.replace('{{input}}', input)
    return { systemPrompt, userPrompt }
  }

  /**
   * Map enhancement mode to a category for history
   */
  private categorizeMode(mode: EnhanceMode): string {
    const categories: Record<EnhanceMode, string> = {
      enhance: 'enhancement',
      expand: 'expansion',
      compress: 'compression',
      explain: 'analysis',
      translate: 'translation',
      'grammar-fix': 'editing',
      'convert-prd': 'conversion',
      'convert-markdown': 'conversion',
      'notes-to-prompt': 'conversion'
    }
    return categories[mode] || 'general'
  }

  /**
   * Get the provider router for direct access (e.g., health checks)
   */
  getRouter(): ProviderRouter {
    return this.router
  }
}

export function cleanLLMResponse(text: string): string {
  let cleaned = text.trim()

  const conversationalIntroRegex =
    /^(?:(?:sure|certainly|as\s+requested|ok|okay|sure\s+thing|absolutely)[,\s!]*)+(?:here\s+is|here\s+are|here's|this\s+is)?\s*(?:the|your)?\s*(?:enhanced|expanded|compressed|translated|corrected|grammar-fixed|final|new|prd|markdown|prds|notes-to-prompt)?\s*(?:prompt|text|version|prd|doc|document|result|output)?[,\s]*(?:as\s+requested)?[,\s]*[:-]*|^(?:here\s+is|here\s+are|here's|this\s+is)[,\s]*(?:the|your)?\s*(?:enhanced|expanded|compressed|translated|corrected|grammar-fixed|final|new|prd|markdown|prds|notes-to-prompt)?\s*(?:prompt|text|version|prd|doc|document|result|output)?[,\s]*(?:as\s+requested)?[,\s]*[:-]*|^(?:(?:enhanced|expanded|compressed|translated|corrected|grammar-fixed)\s+(?:prompt|text|version|prd|result|output)[:-]+)/i

  cleaned = cleaned.replace(conversationalIntroRegex, '').trim()

  // 2. Remove surrounding double quotes, single quotes, or backticks
  // Handles straight quotes ", ', and curly quotes “, ”, ‘, ’
  const startQuote = cleaned[0]
  const endQuote = cleaned[cleaned.length - 1]
  const isWrapped =
    (startQuote === '"' && endQuote === '"') ||
    (startQuote === "'" && endQuote === "'") ||
    (startQuote === '`' && endQuote === '`') ||
    (startQuote === '“' && endQuote === '”') ||
    (startQuote === '‘' && endQuote === '’')

  if (isWrapped) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim()
  }

  return cleaned
}
