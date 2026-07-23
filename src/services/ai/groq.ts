// ====================================================
// PromptForge AI — Groq Adapter
// ====================================================

import Groq from 'groq-sdk'
import type { AIProvider, CompletionOptions, CompletionResult, TokenChunk } from './provider'

export class GroqProvider implements AIProvider {
  readonly id = 'groq'
  readonly name = 'Groq (Cloud)'
  private client: Groq
  private defaultModel: string

  constructor(apiKey: string, defaultModel: string = 'llama-3.1-8b-instant') {
    this.client = new Groq({ apiKey })
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
      throw new Error(`Groq error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list()
      return response.data.map((m) => m.id)
    } catch {
      return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
    }
  }

  /**
   * Stream a completion as incremental token chunks.
   * Uses Groq's OpenAI-compatible streaming (stream: true async-iterable).
   * Callers must handle thrown errors as a signal to fall back to complete().
   */
  async *completeStream(
    userPrompt: string,
    systemPrompt: string,
    options?: CompletionOptions
  ): AsyncIterable<TokenChunk> {
    const model = options?.model || this.defaultModel

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: true
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        const finished = chunk.choices[0]?.finish_reason != null
        yield {
          text: delta,
          done: finished,
          provider: this.id
        }
      }
    } catch (error) {
      throw new Error(
        `Groq stream error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
