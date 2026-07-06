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
