// ====================================================
// PromptForge AI — Provider Router
// ====================================================
// Selects the active provider and implements fallback chain.

import type { DatabaseWrapper } from '../db/database'
import type { AIProvider, CompletionOptions, CompletionResult } from './provider'
import { OllamaProvider } from './ollama'
import { GroqProvider } from './groq'
import { OpenAIProvider } from './openai'
import type { ProviderStatus } from '../../shared/types'

export class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map()
  private fallbackOrder: string[] = []
  private db: DatabaseWrapper

  constructor(db: DatabaseWrapper) {
    this.db = db
    this.initProviders()
  }

  /**
   * Initialize providers from database configuration
   */
  private initProviders(): void {
    // Always register Ollama (no API key needed)
    this.providers.set('ollama', new OllamaProvider())
    this.fallbackOrder.push('ollama')

    // Load configured cloud providers from DB
    try {
      const rows = this.db
        .prepare(
          'SELECT name, base_url, api_key_encrypted, default_model, priority FROM providers WHERE is_active = 1 ORDER BY priority DESC'
        )
        .all() as {
        name: string
        base_url: string
        api_key_encrypted: string | null
        default_model: string
        priority: number
      }[]

      for (const row of rows) {
        if (row.name === 'ollama') continue // Already registered

        if (row.api_key_encrypted) {
          let apiKey: string
          try {
            // Decrypt API key using Electron safeStorage
            const { safeStorage } = require('electron')
            const buffer = Buffer.from(row.api_key_encrypted, 'base64')
            apiKey = safeStorage.decryptString(buffer)
          } catch {
            // If decryption fails, use the raw value (dev mode fallback)
            apiKey = row.api_key_encrypted
          }

          switch (row.name) {
            case 'groq':
              this.providers.set('groq', new GroqProvider(apiKey, row.default_model))
              break
            case 'openai':
              this.providers.set(
                'openai',
                new OpenAIProvider(apiKey, row.default_model, row.base_url)
              )
              break
            case 'openrouter':
              this.providers.set(
                'openrouter',
                new OpenAIProvider(
                  apiKey,
                  row.default_model,
                  row.base_url,
                  'openrouter',
                  'OpenRouter'
                )
              )
              break
            default:
              // Custom OpenAI-compatible provider
              this.providers.set(
                row.name,
                new OpenAIProvider(apiKey, row.default_model, row.base_url, row.name, row.name)
              )
          }
          this.fallbackOrder.push(row.name)
        }
      }
    } catch (error) {
      console.warn('[Router] Failed to load providers from DB:', error)
    }

    // Sort fallback order by priority
    this.fallbackOrder.sort((a, b) => {
      const aProvider = this.providers.get(a)
      const bProvider = this.providers.get(b)
      if (!aProvider || !bProvider) return 0
      // Local first, then by name
      if (a === 'ollama') return -1
      if (b === 'ollama') return 1
      return 0
    })

    console.log(`[Router] Initialized providers: ${Array.from(this.providers.keys()).join(', ')}`)
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Get the default/primary provider
   */
  getDefaultProvider(): AIProvider | undefined {
    // Check settings for user's default
    try {
      const row = this.db
        .prepare("SELECT value FROM settings WHERE key = 'defaultProvider'")
        .get() as { value: string } | undefined

      if (row?.value && this.providers.has(row.value)) {
        return this.providers.get(row.value)
      }
    } catch {
      // Ignore
    }

    // Fallback to first available
    return this.providers.get(this.fallbackOrder[0])
  }

  /**
   * Complete a prompt with automatic fallback on failure
   */
  async completeWithFallback(
    userPrompt: string,
    systemPrompt: string,
    options?: CompletionOptions,
    preferredProvider?: string
  ): Promise<CompletionResult> {
    // Build ordered list: preferred first, then fallback chain
    const tryOrder = preferredProvider
      ? [preferredProvider, ...this.fallbackOrder.filter((p) => p !== preferredProvider)]
      : this.fallbackOrder

    let lastError: Error | null = null

    for (const providerName of tryOrder) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      try {
        const available = await provider.isAvailable()
        if (!available) {
          console.warn(`[Router] ${providerName} is not available, trying next...`)
          continue
        }

        const result = await provider.complete(userPrompt, systemPrompt, options)
        console.log(
          `[Router] ${providerName} completed in ${result.latencyMs}ms (${result.tokensUsed} tokens)`
        )
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[Router] ${providerName} failed: ${lastError.message}, trying next...`)
      }
    }

    throw lastError || new Error('No AI providers available')
  }

  /**
   * Check health of all providers
   */
  async checkAllHealth(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = []

    for (const [name, provider] of this.providers) {
      const startTime = Date.now()
      try {
        const available = await provider.isAvailable()
        statuses.push({
          name,
          status: available ? 'healthy' : 'offline',
          latencyMs: Date.now() - startTime,
          lastChecked: new Date().toISOString()
        })
      } catch {
        statuses.push({
          name,
          status: 'offline',
          latencyMs: Date.now() - startTime,
          lastChecked: new Date().toISOString()
        })
      }
    }

    return statuses
  }

  /**
   * List models for a specific provider
   */
  async listModels(providerName: string): Promise<string[]> {
    const provider = this.providers.get(providerName)
    if (!provider) return []
    return provider.listModels()
  }

  /**
   * Register or update a provider at runtime
   */
  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider)
    if (!this.fallbackOrder.includes(name)) {
      this.fallbackOrder.push(name)
    }
  }

  /**
   * Get all registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys())
  }
}
