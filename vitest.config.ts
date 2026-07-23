// ====================================================
// PromptForge AI — Vitest Configuration
// ====================================================

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/services/**/*', 'src/shared/**/*'],
      thresholds: {
        statements: 90,
        branches: 60,
        functions: 90,
        lines: 90
      }
    },
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@services': resolve(__dirname, 'src/services'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  }
})
