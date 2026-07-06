// ====================================================
// PromptForge AI — Environment Variable Validator
// ====================================================

import { z } from 'zod'

export const envSchema = z.object({
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('9721'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false')
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate process.env variables and return parsed object.
 * In Electron, process.env is populated from local system and .env file.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format())
    throw new Error('Invalid environment variables')
  }

  return result.data
}
