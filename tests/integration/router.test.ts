// ====================================================
// PromptForge AI — Router Fallback Integration Tests
// ====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRouter } from '../../src/services/ai/router'
import type { DatabaseWrapper } from '../../src/services/db/database'
import type { AIProvider } from '../../src/services/ai/provider'

describe('Provider Router Fallback Logic', () => {
  let mockDb: DatabaseWrapper
  let mockSuccessProvider: AIProvider
  let mockFailureProvider: AIProvider
  let mockOfflineProvider: AIProvider

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockReturnValue([]) // Empty providers list initially
      }),
      exec: vi.fn(),
      pragma: vi.fn(),
      transaction: vi.fn(),
      save: vi.fn(),
      close: vi.fn()
    } as unknown as DatabaseWrapper

    mockSuccessProvider = {
      id: 'success-mock',
      name: 'Success Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockResolvedValue({
        text: 'Successful response',
        tokensUsed: 120,
        latencyMs: 100,
        provider: 'success-mock',
        model: 'good-model'
      }),
      listModels: vi.fn().mockResolvedValue(['good-model'])
    }

    mockFailureProvider = {
      id: 'failure-mock',
      name: 'Failure Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockRejectedValue(new Error('Connection timeout')),
      listModels: vi.fn().mockResolvedValue(['bad-model'])
    }

    mockOfflineProvider = {
      id: 'offline-mock',
      name: 'Offline Provider',
      isAvailable: vi.fn().mockResolvedValue(false),
      complete: vi.fn().mockResolvedValue({
        text: 'Offline response',
        tokensUsed: 50,
        latencyMs: 10,
        provider: 'offline-mock',
        model: 'offline-model'
      }),
      listModels: vi.fn().mockResolvedValue(['offline-model'])
    }
  })

  it('should use preferred provider if it succeeds', async () => {
    const router = new ProviderRouter(mockDb)
    router.registerProvider('success-mock', mockSuccessProvider)

    const res = await router.completeWithFallback('hello', 'system prompt', {}, 'success-mock')
    expect(res.text).toBe('Successful response')
    expect(res.provider).toBe('success-mock')
    expect(mockSuccessProvider.complete).toHaveBeenCalledTimes(1)
  })

  it('should fallback to secondary provider if primary fails', async () => {
    const router = new ProviderRouter(mockDb)

    // Register both providers
    router.registerProvider('failure-mock', mockFailureProvider)
    router.registerProvider('success-mock', mockSuccessProvider)

    // Execute with preferred as failure-mock
    const res = await router.completeWithFallback('hello', 'system prompt', {}, 'failure-mock')

    expect(res.text).toBe('Successful response')
    expect(res.provider).toBe('success-mock')
    expect(mockFailureProvider.complete).toHaveBeenCalledTimes(1)
    expect(mockSuccessProvider.complete).toHaveBeenCalledTimes(1)
  })

  it('should skip providers that report isAvailable === false', async () => {
    const router = new ProviderRouter(mockDb)

    // Register both providers
    router.registerProvider('offline-mock', mockOfflineProvider)
    router.registerProvider('success-mock', mockSuccessProvider)

    // Execute with preferred as offline-mock
    const res = await router.completeWithFallback('hello', 'system prompt', {}, 'offline-mock')

    expect(res.text).toBe('Successful response')
    expect(res.provider).toBe('success-mock')
    expect(mockOfflineProvider.complete).toHaveBeenCalledTimes(0)
    expect(mockSuccessProvider.complete).toHaveBeenCalledTimes(1)
  })

  it('should raise an error if all providers fail', async () => {
    const router = new ProviderRouter(mockDb)
    router.registerProvider('failure-mock', mockFailureProvider)

    await expect(
      router.completeWithFallback('hello', 'system prompt', {}, 'failure-mock')
    ).rejects.toThrow('Connection timeout')
  })

  it('should support listing models and resolving registered names', async () => {
    const router = new ProviderRouter(mockDb)
    router.registerProvider('success-mock', mockSuccessProvider)

    const names = router.getProviderNames()
    expect(names).toEqual(['success-mock'])

    const models = await router.listModels('success-mock')
    expect(models).toEqual(['good-model'])

    const empty = await router.listModels('unknown-provider')
    expect(empty).toEqual([])
  })

  it('should verify health of all providers via checkAllHealth', async () => {
    const router = new ProviderRouter(mockDb)
    router.registerProvider('success-mock', mockSuccessProvider)
    router.registerProvider('offline-mock', mockOfflineProvider)

    const healths = await router.checkAllHealth()
    expect(healths).toHaveLength(2)

    const successHealth = healths.find((h) => h.name === 'success-mock')
    expect(successHealth?.status).toBe('healthy')

    const offlineHealth = healths.find((h) => h.name === 'offline-mock')
    expect(offlineHealth?.status).toBe('offline')
  })
})

describe('Provider Router Streaming (Hybrid Fallback)', () => {
  let mockDb: DatabaseWrapper

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockReturnValue([])
      }),
      exec: vi.fn(),
      pragma: vi.fn(),
      transaction: vi.fn(),
      save: vi.fn(),
      close: vi.fn()
    } as unknown as DatabaseWrapper
  })

  async function collectStream(
    router: ProviderRouter,
    preferredProvider?: string
  ): Promise<{ chunks: { text: string; done: boolean; provider: string }[]; result: unknown }> {
    const gen = router.streamWithFallback('hello', 'system', {}, preferredProvider)
    const chunks: { text: string; done: boolean; provider: string }[] = []
    let next = await gen.next()
    while (!next.done) {
      chunks.push(next.value)
      next = await gen.next()
    }
    return { chunks, result: next.value }
  }

  it('should stream chunks from a provider that implements completeStream (happy path)', async () => {
    const streamingProvider: AIProvider = {
      id: 'stream-mock',
      name: 'Streaming Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockResolvedValue({
        text: 'unused',
        tokensUsed: 0,
        latencyMs: 0,
        provider: 'stream-mock',
        model: 'x'
      }),
      completeStream: async function* () {
        yield { text: 'Hello ', done: false, provider: 'stream-mock' }
        yield { text: 'World', done: false, provider: 'stream-mock' }
        yield { text: '', done: true, provider: 'stream-mock' }
      },
      listModels: vi.fn().mockResolvedValue([])
    }

    const router = new ProviderRouter(mockDb)
    router.registerProvider('stream-mock', streamingProvider)

    const { chunks, result } = await collectStream(router, 'stream-mock')

    expect(chunks.map((c) => c.text).join('')).toBe('Hello World')
    expect(chunks[chunks.length - 1].done).toBe(true)
    expect((result as { text: string }).text).toBe('Hello World')
    expect((result as { provider: string }).provider).toBe('stream-mock')
  })

  it('should fall back to complete() when the provider has no completeStream implementation', async () => {
    const nonStreamingProvider: AIProvider = {
      id: 'no-stream-mock',
      name: 'Non-Streaming Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockResolvedValue({
        text: 'Fallback complete result',
        tokensUsed: 42,
        latencyMs: 55,
        provider: 'no-stream-mock',
        model: 'x'
      }),
      listModels: vi.fn().mockResolvedValue([])
    }

    const router = new ProviderRouter(mockDb)
    router.registerProvider('no-stream-mock', nonStreamingProvider)

    const { chunks, result } = await collectStream(router, 'no-stream-mock')

    // Non-streaming fallback delivers exactly one synthetic done chunk
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('Fallback complete result')
    expect(chunks[0].done).toBe(true)
    expect((result as { text: string }).text).toBe('Fallback complete result')
    expect(nonStreamingProvider.complete).toHaveBeenCalledTimes(1)
  })

  it('should fall back to complete() when completeStream throws mid-stream', async () => {
    const flakyProvider: AIProvider = {
      id: 'flaky-mock',
      name: 'Flaky Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockResolvedValue({
        text: 'Recovered via fallback',
        tokensUsed: 10,
        latencyMs: 20,
        provider: 'flaky-mock',
        model: 'x'
      }),
      completeStream: async function* () {
        yield { text: 'partial ', done: false, provider: 'flaky-mock' }
        throw new Error('stream connection dropped')
      },
      listModels: vi.fn().mockResolvedValue([])
    }

    const router = new ProviderRouter(mockDb)
    router.registerProvider('flaky-mock', flakyProvider)

    const onFallback = vi.fn()
    const gen = router.streamWithFallback('hello', 'system', {}, 'flaky-mock', onFallback)
    const chunks: { text: string; done: boolean }[] = []
    let next = await gen.next()
    while (!next.done) {
      chunks.push(next.value)
      next = await gen.next()
    }

    // Should have received the partial chunk before failure, then the fallback's synthetic chunk
    expect(chunks.some((c) => c.text === 'partial ')).toBe(true)
    expect(chunks[chunks.length - 1].text).toBe('Recovered via fallback')
    expect(chunks[chunks.length - 1].done).toBe(true)
    expect(onFallback).toHaveBeenCalled()
    expect(flakyProvider.complete).toHaveBeenCalledTimes(1)
  })

  it('should handle an empty/zero-chunk stream gracefully', async () => {
    const emptyStreamProvider: AIProvider = {
      id: 'empty-mock',
      name: 'Empty Stream Provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      complete: vi.fn().mockResolvedValue({
        text: '',
        tokensUsed: 0,
        latencyMs: 5,
        provider: 'empty-mock',
        model: 'x'
      }),
      completeStream: async function* () {
        yield { text: '', done: true, provider: 'empty-mock' }
      },
      listModels: vi.fn().mockResolvedValue([])
    }

    const router = new ProviderRouter(mockDb)
    router.registerProvider('empty-mock', emptyStreamProvider)

    const { chunks, result } = await collectStream(router, 'empty-mock')

    expect(chunks).toHaveLength(1)
    expect(chunks[0].done).toBe(true)
    expect((result as { text: string }).text).toBe('')
  })
})
