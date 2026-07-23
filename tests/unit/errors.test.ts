// ====================================================
// PromptForge AI — Structured Errors Unit Tests
// ====================================================

import { describe, it, expect } from 'vitest'
import {
  ValidationError,
  ConfigurationError,
  IPCError,
  NetworkError,
  DatabaseError,
  FilesystemError,
  UnknownError
} from '../../src/shared/errors'

describe('Structured Errors', () => {
  it('should instantiate ValidationError with standard properties', () => {
    const err = new ValidationError(
      'Invalid request text',
      'Input was too long',
      'Try sending a shorter text'
    )
    expect(err.name).toBe('ValidationError')
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.message).toBe('Invalid request text')
    expect(err.devMessage).toBe('Input was too long')
    expect(err.recoverySuggestion).toBe('Try sending a shorter text')
    expect(err.timestamp).toBeDefined()
  })

  it('should support default recovery suggestions', () => {
    const err = new ConfigurationError('Key mismatch')
    expect(err.code).toBe('CONFIGURATION_ERROR')
    expect(err.recoverySuggestion).toContain('Verify your configuration')
  })

  it('should serialize error to JSON details', () => {
    const err = new IPCError('IPC Timeout', 'ipcMain handler did not reply')
    const json = err.toJSON()
    expect(json.code).toBe('IPC_ERROR')
    expect(json.message).toBe('IPC Timeout')
    expect(json.devMessage).toBe('ipcMain handler did not reply')
    expect(json.recoverySuggestion).toContain('Try restarting')
    expect(json.timestamp).toBeDefined()
  })

  it('should instantiate NetworkError, DatabaseError, FilesystemError, and UnknownError', () => {
    const netErr = new NetworkError('API offline')
    expect(netErr.code).toBe('NETWORK_ERROR')

    const dbErr = new DatabaseError('Corrupt SQLite')
    expect(dbErr.code).toBe('DATABASE_ERROR')

    const fsErr = new FilesystemError('Permission denied')
    expect(fsErr.code).toBe('FILESYSTEM_ERROR')

    const unkErr = new UnknownError('Internal system error')
    expect(unkErr.code).toBe('UNKNOWN_ERROR')
  })
})
