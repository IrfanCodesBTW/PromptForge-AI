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
 * A single incremental chunk of a streaming completion.
 * Emitted by `AIProvider.completeStream()` implementations.
 */
export interface TokenChunk {
  /** Incremental text fragment for this chunk (empty string on the final done chunk if no trailing content) */
  text: string
  /** True on the last chunk of the stream */
  done: boolean
  /** Provider id that produced this chunk */
  provider: string
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
   * Send a prompt for completion and stream back incremental token chunks.
   * Optional — not all providers/adapters are guaranteed to implement this.
   * Consumers (e.g. PromptEngine.enhanceStream()) must treat a missing
   * implementation or a mid-stream failure as a signal to fall back to
   * `complete()` (hybrid fallback), never as a hard error on its own.
   */
  completeStream?(
    userPrompt: string,
    systemPrompt: string,
    options?: CompletionOptions
  ): AsyncIterable<TokenChunk>

  /**
   * List available models for this provider.
   */
  listModels(): Promise<string[]>
}
