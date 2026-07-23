// ====================================================
// PromptForge AI — Settings Personas Tab Snapshot Test
// ====================================================
// @vitest-environment jsdom
// (Scoped to this file only — the global Vitest config runs in `node`
// environment for speed; this is the one file that needs a real DOM to
// render React components via @testing-library/react.)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Settings } from '../../src/renderer/src/pages/Settings'
import type { Persona } from '../../src/shared/types'

const mockPersonas: Persona[] = [
  {
    id: '11111111111111111111111111111111',
    name: 'General',
    description: 'Neutral, balanced tone.',
    tone: 'professional',
    formatRules: 'Use clear, plain language.',
    systemPromptInjection: 'Respond in a neutral, professional tone.',
    isDefault: true,
    isBuiltin: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '22222222222222222222222222222222',
    name: 'Developer',
    description: 'Technical and concise.',
    tone: 'technical',
    formatRules: 'Use code blocks.',
    systemPromptInjection: 'You are writing for a senior software engineer audience.',
    isDefault: false,
    isBuiltin: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

// Minimal window.api mock sufficient to drive Settings.tsx's initial mount
// (loadSettings/loadProviders/loadHotkeys all fire on mount regardless of
// which tab is active).
function installMockApi(): void {
  const win = window as unknown as { api: unknown }
  win.api = {
    invoke: vi.fn().mockImplementation((channel: string) => {
      if (channel === 'promptforge:settings:get-all') return Promise.resolve({})
      if (channel === 'promptforge:provider:list') return Promise.resolve([])
      if (channel === 'promptforge:hotkey:list') return Promise.resolve([])
      if (channel === 'promptforge:persona:list') return Promise.resolve(mockPersonas)
      return Promise.resolve(null)
    }),
    on: vi.fn().mockReturnValue(() => {}),
    send: vi.fn()
  }
}

describe('Settings — Personas Tab', () => {
  beforeEach(() => {
    installMockApi()
  })

  it('renders the Personas tab with the persona list and editor matching the expected structure', async () => {
    const { container } = render(<Settings />)

    // Switch to the Personas tab (sidebar nav button, distinct from any
    // in-content text that might also say "Personas")
    const personasTabButton = screen.getByRole('button', { name: 'Personas' })
    fireEvent.click(personasTabButton)

    // Wait for the persona list panel to render both seeded personas.
    // Scope the query to the list panel (first nav-like column in the
    // editor area) to avoid ambiguity with the "General" settings tab button.
    await waitFor(() => {
      const developerButton = screen.getByRole('button', { name: /Developer/ })
      expect(developerButton).toBeTruthy()
    })

    const generalPersonaButtons = screen.getAllByText('General')
    // One is the "General" settings tab in the outer sidebar, the other is
    // the "General" persona list item — both are expected to exist.
    expect(generalPersonaButtons.length).toBeGreaterThanOrEqual(2)

    expect(container).toMatchSnapshot()
  })

  it('selects a persona and populates the editor form with its fields', async () => {
    render(<Settings />)

    fireEvent.click(screen.getByRole('button', { name: 'Personas' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Developer/ })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /Developer/ }))

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      expect(nameInput.value).toBe('Developer')
    })
  })

  it('shows a checkmark next to the default persona in the list', async () => {
    const { container } = render(<Settings />)

    fireEvent.click(screen.getByRole('button', { name: 'Personas' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Developer/ })).toBeTruthy()
    })

    // Scope to the persona list panel specifically (a <nav>-less div using
    // the w-56 list-panel class) to avoid colliding with the sidebar's
    // "General" settings tab button, which has an unrelated identical label.
    const personaListPanel = container.querySelector('.w-56')
    expect(personaListPanel).toBeTruthy()
    const generalPersonaListItem = within(personaListPanel as HTMLElement)
      .getByText('General')
      .closest('button')
    expect(generalPersonaListItem).toBeTruthy()

    const svg = generalPersonaListItem!.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
