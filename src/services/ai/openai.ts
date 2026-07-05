// ====================================================
// PromptForge AI — OpenAI Adapter
// ====================================================
// Also works with OpenRouter and any OpenAI-compatible endpoint.

import OpenAI from 'openai'
import type { AIProvider, CompletionOptions, CompletionResult } from './provider'

export class OpenAIProvider implements AIProvider {
  readonly id: string
  readonly name: string
  private client: OpenAI
  private defaultModel: string

  constructor(
    apiKey: string,
    defaultModel: string = 'gpt-4o',
    baseURL: string = 'https://api.openai.com/v1',
    id: string = 'openai',
    name: string = 'OpenAI'
  ) {
    this.id = id
    this.name = name
    this.client = new OpenAI({ apiKey, baseURL })
    this.defaultModel = defaultModel
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }

  async complete(
    userPrompt: string,
    systemPrompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    const model = options?.model || this.defaultModel
    const startTime = Date.now()

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048
      })

      const latencyMs = Date.now() - startTime
      const tokensUsed = response.usage?.total_tokens ?? 0

      return {
        text: response.choices[0]?.message?.content || '',
        tokensUsed,
        latencyMs,
        provider: this.id,
        model
      }
    } catch (error) {
      throw new Error(
        `${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list()
      return response.data.map((m) => m.id).slice(0, 20) // Limit for UI
    } catch {
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    }
  }
}
