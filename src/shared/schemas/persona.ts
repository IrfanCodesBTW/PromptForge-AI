// ====================================================
// PromptForge AI — Persona Zod Schemas
// ====================================================

import { z } from 'zod'

export const personaToneSchema = z.enum([
  'professional',
  'casual',
  'technical',
  'creative',
  'formal'
])

export const personaCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  tone: personaToneSchema,
  formatRules: z.string().max(2000).optional(),
  systemPromptInjection: z.string().min(1).max(4000),
  isDefault: z.boolean().optional()
})

export const personaUpdateSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{32}$/),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  tone: personaToneSchema.optional(),
  formatRules: z.string().max(2000).optional(),
  systemPromptInjection: z.string().min(1).max(4000).optional(),
  isDefault: z.boolean().optional()
})

export const personaIdSchema = z.string().regex(/^[a-fA-F0-9]{32}$/)

export type PersonaCreateInput = z.infer<typeof personaCreateSchema>
export type PersonaUpdateInput = z.infer<typeof personaUpdateSchema>
