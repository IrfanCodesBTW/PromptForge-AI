// ====================================================
// PromptForge AI — Centralized Structured Errors
// ====================================================

export interface ErrorDetails {
  code: string
  message: string
  devMessage?: string
  recoverySuggestion?: string
  timestamp: string
}

export abstract class AppError extends Error {
  readonly code: string
  readonly devMessage?: string
  readonly recoverySuggestion?: string
  readonly timestamp: string

  constructor(code: string, message: string, devMessage?: string, recoverySuggestion?: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.devMessage = devMessage
    this.recoverySuggestion = recoverySuggestion
    this.timestamp = new Date().toISOString()

    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      devMessage: this.devMessage,
      recoverySuggestion: this.recoverySuggestion,
      timestamp: this.timestamp
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'VALIDATION_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Please check your inputs and try again.'
    )
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'CONFIGURATION_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Verify your configuration settings or restart the application.'
    )
  }
}

export class IPCError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'IPC_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Try restarting the application if this communication error persists.'
    )
  }
}

export class NetworkError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'NETWORK_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Verify your internet connection and API status page.'
    )
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'DATABASE_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Compact the database or clear settings to resolve corruption.'
    )
  }
}

export class FilesystemError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'FILESYSTEM_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'Ensure you have write permissions to your app directory.'
    )
  }
}

export class UnknownError extends AppError {
  constructor(message: string, devMessage?: string, recoverySuggestion?: string) {
    super(
      'UNKNOWN_ERROR',
      message,
      devMessage,
      recoverySuggestion || 'An unexpected error occurred. Please contact support.'
    )
  }
}
