// ====================================================
// PromptForge AI — Shared Utils Unit Tests
// ====================================================

import { describe, it, expect, vi } from 'vitest'
import {
  generateId,
  now,
  formatDate,
  formatDuration,
  formatTokens,
  truncate,
  sleep,
  debounce,
  withRetry,
  isEmpty,
  safeJsonParse
} from '../../src/shared/utils'

describe('Shared Utils', () => {
  describe('generateId', () => {
    it('should generate a 32-character hex string', () => {
      const id = generateId()
      expect(id).toHaveLength(32)
      expect(id).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('now', () => {
    it('should return a valid ISO timestamp', () => {
      const timestamp = now()
      expect(Date.parse(timestamp)).not.toBeNaN()
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })

  describe('formatDate', () => {
    it('should format date strings properly', () => {
      const dateStr = '2026-07-06T10:00:00.000Z'
      const formatted = formatDate(dateStr)
      expect(formatted).toContain('2026')
      expect(formatted).toContain('Jul')
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds below 1 second', () => {
      expect(formatDuration(450)).toBe('450ms')
    })

    it('should format seconds above 1 second', () => {
      expect(formatDuration(2500)).toBe('2.5s')
    })
  })

  describe('formatTokens', () => {
    it('should format tokens below 1000', () => {
      expect(formatTokens(850)).toBe('850')
    })

    it('should format tokens above 1000', () => {
      expect(formatTokens(2400)).toBe('2.4K')
    })
  })

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('should truncate long text with ellipses', () => {
      expect(truncate('hello world', 8)).toBe('hello...')
    })
  })

  describe('sleep', () => {
    it('should delay execution for specified time', async () => {
      const start = Date.now()
      await sleep(50)
      const duration = Date.now() - start
      expect(duration).toBeGreaterThanOrEqual(45)
    })
  })

  describe('debounce', () => {
    it('should delay function invocation', async () => {
      vi.useFakeTimers()
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)

      debounced()
      debounced()
      debounced()

      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
  })

  describe('withRetry', () => {
    it('should succeed on first try if no error', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const res = await withRetry(mockFn, 3, 10)
      expect(res).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on error and succeed eventually', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')

      const res = await withRetry(mockFn, 3, 10)
      expect(res).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should fail after max attempts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('fail'))
      await expect(withRetry(mockFn, 3, 10)).rejects.toThrow('fail')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('isEmpty', () => {
    it('should identify empty values', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    it('should identify non-empty values', () => {
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty('  a  ')).toBe(false)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 })
    })

    it('should return fallback on invalid JSON', () => {
      expect(safeJsonParse('invalid', { fallback: true })).toEqual({ fallback: true })
    })
  })
})
