// ====================================================
// PromptForge AI — Prompt Engine
// ====================================================
// Main orchestrator: input → template → provider → result → history.

import type { DatabaseWrapper } from '../db/database'
import { ProviderRouter } from '../ai/router'
import { getSystemPrompt, getUserPromptTemplate } from './enhancer'
import { HistoryService } from '../db/history'
import type { EnhanceMode } from '../../shared/types'

export interface EngineResult {
  text: string
  provider: string
  model: string
  tokensUsed: number
  latencyMs: number
  historyId?: string
}

export class PromptEngine {
  private db: DatabaseWrapper
  private router: ProviderRouter
  private history: HistoryService

  constructor(db: DatabaseWrapper) {
    this.db = db
    this.router = new ProviderRouter(db)
    this.history = new HistoryService(db)
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

    // Step 1: Get prompts
    let systemPrompt = getSystemPrompt(mode)
    let userPromptTemplate = getUserPromptTemplate(mode)

    // Load custom template from DB if templateId is provided
    if (options?.templateId) {
      try {
        const row = this.db
          .prepare(
            'SELECT system_prompt, user_prompt_template FROM templates WHERE id = ? AND is_active = 1'
          )
          .get(options.templateId) as
          { system_prompt: string; user_prompt_template: string } | undefined

        if (row) {
          systemPrompt = row.system_prompt
          userPromptTemplate = row.user_prompt_template
          console.log(`[Engine] Loaded custom template: ${options.templateId}`)
        }
      } catch (error) {
        console.warn(
          `[Engine] Failed to load custom template ${options.templateId}, using defaults:`,
          error
        )
      }
    }

    // Step 2: Interpolate user prompt
    const userPrompt = userPromptTemplate.replace('{{input}}', input)

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
