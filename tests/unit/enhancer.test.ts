// ====================================================
// PromptForge AI — Prompt Enhancer/Cleaner Unit Tests
// ====================================================

import { describe, it, expect } from 'vitest'
import { cleanLLMResponse } from '../../src/services/prompt/engine'
import { getSystemPrompt, getUserPromptTemplate } from '../../src/services/prompt/enhancer'

describe('Prompt Enhancer / Cleaner', () => {
  describe('cleanLLMResponse', () => {
    it('should remove conversational introduction strings', () => {
      const input =
        'Sure, here is the enhanced prompt:\n\nCreate a Python script that scrapes headlines.'
      expect(cleanLLMResponse(input)).toBe('Create a Python script that scrapes headlines.')
    })

    it('should remove leading/trailing double quotes', () => {
      const input = '"Write a professional email asking for feedback."'
      expect(cleanLLMResponse(input)).toBe('Write a professional email asking for feedback.')
    })

    it('should remove curly quotes', () => {
      const input = '“Generate a landing page stylesheet.”'
      expect(cleanLLMResponse(input)).toBe('Generate a landing page stylesheet.')
    })

    it('should remove backticks', () => {
      const input = '`Optimize this SQL query:`'
      expect(cleanLLMResponse(input)).toBe('Optimize this SQL query:')
    })

    it('should preserve formatting inside the prompt', () => {
      const input = 'Here is your prompt:\n\n- Task: Write code\n- Constraints: No comments'
      expect(cleanLLMResponse(input)).toBe('- Task: Write code\n- Constraints: No comments')
    })
  })

  describe('Prompt Templates Getter', () => {
    it('should return valid system prompt for enhance mode', () => {
      const prompt = getSystemPrompt('enhance')
      expect(prompt).toContain('expert prompt engineer')
    })

    it('should return valid user prompt template for expand mode', () => {
      const template = getUserPromptTemplate('expand')
      expect(template).toContain('Expand this prompt')
    })
  })
})
