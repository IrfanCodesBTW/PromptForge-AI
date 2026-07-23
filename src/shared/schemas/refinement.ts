// ====================================================
// PromptForge AI — Refinement Zod Schemas
// ====================================================

import { z } from 'zod'

export const refinementStartSchema = z.object({
  originalText: z.string().min(1),
  currentOutput: z.string().min(1),
  mode: z.string().optional(),
  templateId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional()
})

export const refinementInstructionSchema = z.object({
  sessionId: z.string().min(1),
  instruction: z.string().min(1).max(2000)
})

export const refinementSessionIdSchema = z.object({
  sessionId: z.string().min(1)
})

export type RefinementStartInput = z.infer<typeof refinementStartSchema>
export type RefinementInstructionInput = z.infer<typeof refinementInstructionSchema>
export type RefinementSessionIdInput = z.infer<typeof refinementSessionIdSchema>
