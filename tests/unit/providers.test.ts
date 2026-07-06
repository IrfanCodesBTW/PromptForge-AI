// ====================================================
// PromptForge AI — AI Provider Adapters Unit Tests
// ====================================================

import { describe, it, expect, vi } from 'vitest'
import { GroqProvider } from '../../src/services/ai/groq'
import { OpenAIProvider } from '../../src/services/ai/openai'
import { OllamaProvider } from '../../src/services/ai/ollama'

// Mock groq-sdk
vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Groq response' } }],
              usage: { total_tokens: 50 }
            })
          }
        },
        models: {
          list: vi.fn().mockResolvedValue({
            data: [{ id: 'llama-3.1-8b-instant' }]
          })
        }
      }
    })
  }
})

// Mock openai
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'OpenAI response' } }],
              usage: { total_tokens: 60 }
            })
          }
        },
        models: {
          list: vi.fn().mockResolvedValue({
            data: [{ id: 'gpt-4o' }]
          })
        }
      }
    })
  }
})

// Mock ollama
vi.mock('ollama', () => {
  return {
    Ollama: vi.fn().mockImplementation(() => {
      return {
        chat: vi.fn().mockResolvedValue({
          message: { content: 'Ollama response' },
          eval_count: 30,
          prompt_eval_count: 20
        }),
        list: vi.fn().mockResolvedValue({
          models: [{ name: 'llama3.1' }]
        })
      }
    })
  }
})

describe('AI Provider Adapters', () => {
  describe('GroqProvider', () => {
    it('should complete prompts and return structured results', async () => {
      const provider = new GroqProvider('gsk_key', 'llama-3.1-8b-instant')
      const res = await provider.complete('user prompt', 'system prompt')
      expect(res.text).toBe('Groq response')
      expect(res.tokensUsed).toBe(50)
      expect(res.provider).toBe('groq')
      expect(res.model).toBe('llama-3.1-8b-instant')
      expect(res.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('should list models from Groq API', async () => {
      const provider = new GroqProvider('gsk_key')
      const models = await provider.listModels()
      expect(models).toEqual(['llama-3.1-8b-instant'])
    })

    it('should return availability status', async () => {
      const provider = new GroqProvider('gsk_key')
      const available = await provider.isAvailable()
      expect(available).toBe(true)
    })
  })

  describe('OpenAIProvider', () => {
    it('should complete prompts and return structured results', async () => {
      const provider = new OpenAIProvider('sk_key', 'gpt-4o')
      const res = await provider.complete('user prompt', 'system prompt')
      expect(res.text).toBe('OpenAI response')
      expect(res.tokensUsed).toBe(60)
      expect(res.provider).toBe('openai')
      expect(res.model).toBe('gpt-4o')
    })

    it('should list models from OpenAI API', async () => {
      const provider = new OpenAIProvider('sk_key')
      const models = await provider.listModels()
      expect(models).toEqual(['gpt-4o'])
    })

    it('should return availability status', async () => {
      const provider = new OpenAIProvider('sk_key')
      const available = await provider.isAvailable()
      expect(available).toBe(true)
    })
  })

  describe('OllamaProvider', () => {
    it('should complete prompts and return structured results', async () => {
      const provider = new OllamaProvider('http://localhost:11434', 'llama3.1')
      const res = await provider.complete('user prompt', 'system prompt')
      expect(res.text).toBe('Ollama response')
      expect(res.tokensUsed).toBe(50)
      expect(res.provider).toBe('ollama')
      expect(res.model).toBe('llama3.1')
    })

    it('should list models from local Ollama instance', async () => {
      const provider = new OllamaProvider()
      const models = await provider.listModels()
      expect(models).toEqual(['llama3.1'])
    })

    it('should return availability status', async () => {
      const provider = new OllamaProvider()
      const available = await provider.isAvailable()
      expect(available).toBe(true)
    })
  })
})
