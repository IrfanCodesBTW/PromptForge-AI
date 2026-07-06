// ====================================================
// PromptForge AI — Ollama Adapter
// ====================================================

import { Ollama } from 'ollama'
import type { AIProvider, CompletionOptions, CompletionResult } from './provider'

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama (Local)'
  private client: Ollama
  private defaultModel: string

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.1') {
    this.client = new Ollama({ host: baseUrl })
    this.defaultModel = defaultModel
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.list()
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
      const response = await this.client.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048
        }
      })

      const latencyMs = Date.now() - startTime
      const tokensUsed = (response.eval_count || 0) + (response.prompt_eval_count || 0)

      return {
        text: response.message.content,
        tokensUsed,
        latencyMs,
        provider: this.id,
        model
      }
    } catch (error) {
      throw new Error(`Ollama error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.list()
      return response.models.map((m) => m.name)
    } catch {
      return []
    }
  }
}
