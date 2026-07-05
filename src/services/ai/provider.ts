// ====================================================
// PromptForge AI — AI Provider Interface
// ====================================================

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  stream?: boolean
}

export interface CompletionResult {
  text: string
  tokensUsed: number
  latencyMs: number
  provider: string
  model: string
}

/**
 * Base interface for all AI provider adapters.
 * Each provider (Ollama, Groq, OpenAI, etc.) implements this interface.
 */
export interface AIProvider {
  /** Unique provider identifier */
  readonly id: string

  /** Human-readable provider name */
  readonly name: string

  /**
   * Check if this provider is currently available.
   * For local providers: checks if the server is running.
   * For cloud providers: pings the API endpoint.
   */
  isAvailable(): Promise<boolean>

  /**
   * Send a prompt for completion/enhancement.
   * Returns the generated text with metadata.
   */
  complete(
    userPrompt: string,
    systemPrompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResult>

  /**
   * List available models for this provider.
   */
  listModels(): Promise<string[]>
}
