// ====================================================
// PromptForge AI — Settings Page
// ====================================================

import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  RotateCcw,
  CheckCircle,
  Zap,
  Globe,
  Keyboard,
  Palette,
  Shield,
  User
} from 'lucide-react'
import { useInvoke } from '../hooks/useIPC'
import { useAppStore } from '../stores/appStore'
import { IPC_CHANNELS } from '../../../shared/constants'
import { showToast } from '../components/ui/Toast'
import type { ThemeMode, Persona, PersonaTone } from '../../../shared/types'

type SettingsSection = 'general' | 'providers' | 'hotkeys' | 'personas' | 'appearance' | 'privacy'

const sections = [
  { id: 'general' as const, label: 'General', icon: Zap },
  { id: 'providers' as const, label: 'Providers', icon: Globe },
  { id: 'hotkeys' as const, label: 'Hotkeys', icon: Keyboard },
  { id: 'personas' as const, label: 'Personas', icon: User },
  { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  { id: 'privacy' as const, label: 'Privacy', icon: Shield }
]

export function Settings(): JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [providers, setProviders] = useState<unknown[]>([])
  const [hotkeys, setHotkeys] = useState<unknown[]>([])
  const invoke = useInvoke()
  const { setTheme } = useAppStore()

  // Load settings on mount
  useEffect(() => {
    loadSettings()
    loadProviders()
    loadHotkeys()
  }, [])

  const loadSettings = useCallback(async () => {
    const all = (await invoke(IPC_CHANNELS.SETTINGS_GET_ALL)) as Record<string, string>
    setSettings(all)
  }, [invoke])

  const loadProviders = useCallback(async () => {
    const list = (await invoke(IPC_CHANNELS.PROVIDER_LIST)) as unknown[]
    setProviders(list)
  }, [invoke])

  const loadHotkeys = useCallback(async () => {
    const list = (await invoke(IPC_CHANNELS.HOTKEY_LIST)) as unknown[]
    setHotkeys(list)
  }, [invoke])

  const saveSetting = useCallback(
    async (key: string, value: string) => {
      await invoke(IPC_CHANNELS.SETTINGS_SET, { key, value })
      setSettings((prev) => ({ ...prev, [key]: value }))

      // Special handling for theme
      if (key === 'theme') {
        setTheme(value as ThemeMode)
      }

      showToast({ type: 'success', title: 'Setting saved', message: `${key} updated` })
    },
    [invoke, setTheme]
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="text-xl font-medium font-serif text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-xs">
            Configure PromptForge AI to your preferences
          </p>
        </div>
      </div>

      <div className="flex gap-lg">
        {/* Section tabs */}
        <nav className="w-44 flex-shrink-0 space-y-xs select-none">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-sm px-md py-sm rounded-full text-sm transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                activeSection === id
                  ? 'bg-mint-100 text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card-hover'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-5">
          {activeSection === 'general' && (
            <GeneralSettings settings={settings} onSave={saveSetting} />
          )}
          {activeSection === 'providers' && (
            <ProviderSettings
              settings={settings}
              providers={providers}
              invoke={invoke}
              onReload={loadProviders}
            />
          )}
          {activeSection === 'hotkeys' && (
            <HotkeySettings hotkeys={hotkeys} onReload={loadHotkeys} invoke={invoke} />
          )}
          {activeSection === 'personas' && <PersonaSettings invoke={invoke} />}
          {activeSection === 'appearance' && (
            <AppearanceSettings settings={settings} onSave={saveSetting} />
          )}
          {activeSection === 'privacy' && (
            <PrivacySettings settings={settings} onSave={saveSetting} />
          )}
        </div>
      </div>
    </div>
  )
}

// ----- Section Components -----

function GeneralSettings({
  settings,
  onSave
}: {
  settings: Record<string, string>
  onSave: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <SettingsCard
        title="Default Provider"
        description="Choose the AI provider used for enhancements"
      >
        <select
          value={settings.defaultProvider || 'ollama'}
          onChange={(e) => onSave('defaultProvider', e.target.value)}
          className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
        >
          <option value="ollama">Ollama (Local)</option>
          <option value="groq">Groq (Cloud)</option>
          <option value="openai">OpenAI (Cloud)</option>
        </select>
      </SettingsCard>

      <SettingsCard
        title="Temperature"
        description="Controls randomness (0.0 = deterministic, 2.0 = creative)"
      >
        <div className="flex items-center gap-md">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature || '0.7'}
            onChange={(e) => onSave('temperature', e.target.value)}
            className="flex-1 accent-primary cursor-pointer"
          />
          <span className="text-sm text-text-secondary w-10 text-right font-mono">
            {settings.temperature || '0.7'}
          </span>
        </div>
      </SettingsCard>

      <SettingsCard title="Max Tokens" description="Maximum output length (256–8192)">
        <input
          type="number"
          min="256"
          max="8192"
          step="256"
          value={settings.maxTokens || '2048'}
          onChange={(e) => onSave('maxTokens', e.target.value)}
          className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
        />
      </SettingsCard>

      <SettingsCard
        title="Auto-Paste"
        description="Automatically paste enhanced text after processing"
      >
        <ToggleSwitch
          checked={settings.clipboard_auto_paste !== 'false'}
          onChange={(checked) => onSave('clipboard_auto_paste', String(checked))}
        />
      </SettingsCard>

      <SettingsCard
        title="Floating Preview Window"
        description="Show a live streaming preview near your cursor before committing to clipboard (Accept/Reject/Re-run). When off, hotkeys behave as before: instant clipboard write."
      >
        <ToggleSwitch
          checked={settings.preview_window_enabled === 'true'}
          onChange={(checked) => onSave('preview_window_enabled', String(checked))}
        />
      </SettingsCard>

      <SettingsCard
        title="Refinement Session Timeout"
        description="Inactivity timeout (in minutes) for in-memory multi-turn prompt refinement sessions before they auto-expire (1–60 mins)."
      >
        <input
          type="number"
          min="1"
          max="60"
          value={settings.refinementSessionTimeoutMinutes || '5'}
          onChange={(e) => onSave('refinementSessionTimeoutMinutes', e.target.value)}
          className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
        />
      </SettingsCard>
    </div>
  )
}

function ProviderSettings({
  settings,
  providers,
  invoke,
  onReload
}: {
  settings: Record<string, string>
  providers: unknown[]
  invoke: ReturnType<typeof useInvoke>
  onReload: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(settings.defaultProvider || 'groq')
  const [testing, setTesting] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [loadingModels, setLoadingModels] = useState(false)

  // Fetch models whenever provider changes
  useEffect(() => {
    const provList = providers as { name: string; default_model: string }[]
    const provInfo = provList.find((p) => p.name === selectedProvider)

    setLoadingModels(true)
    invoke(IPC_CHANNELS.PROVIDER_MODELS, { provider: selectedProvider })
      .then((res) => {
        const m = res as string[]
        setModels(m)
        if (provInfo?.default_model && m.includes(provInfo.default_model)) {
          setSelectedModel(provInfo.default_model)
        } else if (m.length > 0) {
          setSelectedModel(m[0])
        }
      })
      .finally(() => {
        setLoadingModels(false)
      })
  }, [selectedProvider, providers, invoke])

  const testProvider = async () => {
    setTesting(true)
    try {
      const status = await invoke(IPC_CHANNELS.PROVIDER_TEST, {
        provider: selectedProvider,
        apiKey
      })
      const s = status as { status: string }
      showToast({
        type: s.status === 'healthy' ? 'success' : 'error',
        title: `${selectedProvider}: ${s.status}`,
        message: s.status === 'healthy' ? 'Provider is reachable' : 'Could not connect'
      })
    } catch {
      showToast({ type: 'error', title: 'Test failed', message: 'Could not reach provider' })
    }
    setTesting(false)
  }
  const saveProvider = async () => {
    try {
      await invoke(IPC_CHANNELS.PROVIDER_UPDATE, {
        provider: selectedProvider,
        apiKey: apiKey || undefined,
        model: selectedModel || undefined
      })
      showToast({ type: 'success', title: 'Saved', message: 'Provider updated successfully' })
      onReload()
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to save provider' })
    }
  }

  return (
    <div className="space-y-5">
      <SettingsCard title="AI Providers" description="Configure API keys for cloud providers">
        <div className="space-y-md">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter</option>
          </select>

          {selectedProvider !== 'ollama' && (
            <input
              type="password"
              placeholder="API Key (Leave blank to keep existing)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
            />
          )}

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
            disabled={loadingModels}
          >
            {loadingModels && <option value="">Loading models...</option>}
            {!loadingModels &&
              models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>

          <div className="flex gap-sm">
            <button
              onClick={testProvider}
              disabled={testing}
              className="flex items-center gap-xs h-9 px-4 bg-pill-bg rounded-full text-sm text-text-primary hover:bg-pill-bg-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-[160ms] ease-standard active:scale-98 disabled:opacity-50 disabled:pointer-events-none select-none"
            >
              <CheckCircle size={14} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={saveProvider}
              className="flex items-center gap-xs h-9 px-4 bg-primary text-text-inverse rounded-full text-sm hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-[160ms] ease-standard active:scale-98 select-none"
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Provider Status" description="Current health of configured providers">
        <div className="space-y-sm">
          {(providers as { name: string; type: string; is_active: number }[]).map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between py-xs border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    p.is_active ? 'bg-success' : 'bg-disabled-text'
                  }`}
                />
                <span className="text-sm text-text-primary capitalize">{p.name}</span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pill-bg text-text-secondary select-none">
                {p.type}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

function HotkeySettings({
  hotkeys,
  onReload,
  invoke
}: {
  hotkeys: unknown[]
  onReload: () => void
  invoke: ReturnType<typeof useInvoke>
}) {
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const startRecording = (id: string) => {
    setRecordingId(id)
  }

  const cancelRecording = () => {
    setRecordingId(null)
  }

  const handleKeyDown = async (e: React.KeyboardEvent, hk: any) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      cancelRecording()
      return
    }

    const modifiers: string[] = []
    if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl')
    if (e.shiftKey) modifiers.push('Shift')
    if (e.altKey) modifiers.push('Alt')

    const key = e.key
    const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(key)
    if (!isModifier && modifiers.length > 0) {
      let keyStr = key.toUpperCase()
      if (key === 'ArrowUp') keyStr = 'Up'
      if (key === 'ArrowDown') keyStr = 'Down'
      if (key === 'ArrowLeft') keyStr = 'Left'
      if (key === 'ArrowRight') keyStr = 'Right'
      if (key === ' ') keyStr = 'Space'

      const newBinding = [...modifiers, keyStr].join('+')

      try {
        await invoke(IPC_CHANNELS.HOTKEY_UPDATE, {
          id: hk.id,
          keybinding: newBinding,
          is_active: hk.is_active
        })
        showToast({
          type: 'success',
          title: 'Hotkey Updated',
          message: `Registered ${newBinding} for ${hk.action}`
        })
        onReload()
      } catch {
        showToast({ type: 'error', title: 'Error', message: 'Failed to update hotkey' })
      }
      setRecordingId(null)
    }
  }

  const toggleHotkey = async (hk: any) => {
    try {
      await invoke(IPC_CHANNELS.HOTKEY_UPDATE, {
        id: hk.id,
        keybinding: hk.keybinding,
        is_active: hk.is_active ? 0 : 1
      })
      onReload()
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update hotkey' })
    }
  }

  return (
    <SettingsCard
      title="Global Hotkeys"
      description="Keyboard shortcuts for enhancement modes. Click the hotkey box to record a new shortcut."
    >
      <div className="space-y-md">
        {(hotkeys as { id: string; action: string; keybinding: string; is_active: number }[]).map(
          (hk) => {
            const isRecording = recordingId === hk.id
            return (
              <div
                key={hk.action}
                className="flex items-center justify-between p-md bg-surface border border-border rounded-sm"
              >
                <div>
                  <span className="text-sm font-medium text-text-primary capitalize block font-sans">
                    {hk.action}
                  </span>
                  <span className="text-xs text-text-secondary mt-xs font-sans">
                    Trigger the {hk.action} prompt template
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => (isRecording ? cancelRecording() : startRecording(hk.id))}
                    onKeyDown={(e) => isRecording && handleKeyDown(e, hk)}
                    className={`h-9 px-md rounded-sm text-xs font-mono border transition-all duration-[160ms] ease-standard min-w-[120px] text-center select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      isRecording
                        ? 'bg-primary border-primary text-text-inverse animate-pulse'
                        : 'bg-surface-elevated border-border text-text-primary hover:bg-pill-bg-hover hover:border-text-secondary'
                    }`}
                  >
                    {isRecording ? 'Press keys...' : hk.keybinding}
                  </button>
                  <ToggleSwitch checked={hk.is_active === 1} onChange={() => toggleHotkey(hk)} />
                </div>
              </div>
            )
          }
        )}
      </div>
    </SettingsCard>
  )
}

const TONE_OPTIONS: PersonaTone[] = ['professional', 'casual', 'technical', 'creative', 'formal']

function PersonaSettings({
  invoke
}: {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
}) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    name: string
    description: string
    tone: PersonaTone
    formatRules: string
    systemPromptInjection: string
  }>({
    name: '',
    description: '',
    tone: 'professional',
    formatRules: '',
    systemPromptInjection: ''
  })

  const loadPersonas = useCallback(async () => {
    const list = await invoke<Persona[]>(IPC_CHANNELS.PERSONA_LIST)
    setPersonas(list)
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id)
    }
  }, [invoke, selectedId])

  useEffect(() => {
    loadPersonas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const selected = personas.find((p) => p.id === selectedId)
    if (selected) {
      setForm({
        name: selected.name,
        description: selected.description || '',
        tone: selected.tone,
        formatRules: selected.formatRules || '',
        systemPromptInjection: selected.systemPromptInjection
      })
    }
  }, [selectedId, personas])

  const selectedPersona = personas.find((p) => p.id === selectedId)

  const handleSave = async () => {
    if (!selectedPersona) return
    try {
      await invoke(IPC_CHANNELS.PERSONA_UPDATE, {
        id: selectedPersona.id,
        name: form.name,
        description: form.description,
        tone: form.tone,
        formatRules: form.formatRules,
        systemPromptInjection: form.systemPromptInjection
      })
      showToast({ type: 'success', title: 'Persona saved', message: `${form.name} updated` })
      loadPersonas()
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to save persona' })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await invoke(IPC_CHANNELS.PERSONA_SET_DEFAULT, id)
      loadPersonas()
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to set default persona' })
    }
  }

  const handleDuplicate = async (persona: Persona) => {
    try {
      const created = await invoke<Persona>(IPC_CHANNELS.PERSONA_CREATE, {
        name: `${persona.name} (Copy)`,
        description: persona.description,
        tone: persona.tone,
        formatRules: persona.formatRules,
        systemPromptInjection: persona.systemPromptInjection
      })
      await loadPersonas()
      setSelectedId(created.id)
      showToast({ type: 'success', title: 'Persona duplicated', message: created.name })
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to duplicate persona' })
    }
  }

  const handleDelete = async (persona: Persona) => {
    if (persona.isBuiltin) return
    try {
      await invoke(IPC_CHANNELS.PERSONA_DELETE, persona.id)
      setSelectedId(null)
      await loadPersonas()
      showToast({ type: 'success', title: 'Persona deleted', message: persona.name })
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete persona' })
    }
  }

  return (
    <div className="flex gap-lg">
      {/* List panel */}
      <div className="w-56 flex-shrink-0 space-y-xs">
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setSelectedId(persona.id)}
            className={`w-full text-left px-md py-sm rounded-sm text-sm transition-colors cursor-pointer flex items-center justify-between ${
              selectedId === persona.id
                ? 'bg-mint-100 text-text-primary font-medium'
                : 'text-text-secondary hover:bg-surface-card-hover hover:text-text-primary'
            }`}
          >
            <span>{persona.name}</span>
            {persona.isDefault && <CheckCircle size={14} className="text-primary" />}
          </button>
        ))}
      </div>

      {/* Editor panel */}
      <div className="flex-1 space-y-5">
        {!selectedPersona ? (
          <SettingsCard
            title="No persona selected"
            description="Select a persona from the list to edit it."
          >
            <div />
          </SettingsCard>
        ) : (
          <>
            <SettingsCard
              title="Identity"
              description="Name, description, and tone of this persona"
            >
              <div className="space-y-md">
                <div>
                  <label htmlFor="persona-name" className="text-xs text-text-secondary mb-xs block">
                    Name
                  </label>
                  <input
                    id="persona-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="persona-description"
                    className="text-xs text-text-secondary mb-xs block"
                  >
                    Description
                  </label>
                  <input
                    id="persona-description"
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-text-secondary mb-xs block">Tone</span>
                  <div className="flex gap-xs">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setForm((f) => ({ ...f, tone }))}
                        className={`flex-1 h-8 px-2 rounded-full text-xs capitalize transition-all duration-[160ms] ease-standard cursor-pointer select-none ${
                          form.tone === tone
                            ? 'bg-primary text-white'
                            : 'bg-pill-bg text-text-secondary hover:bg-pill-bg-hover'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Format Rules"
              description="Free-text formatting guidance for this persona"
            >
              <textarea
                value={form.formatRules}
                onChange={(e) => setForm((f) => ({ ...f, formatRules: e.target.value }))}
                rows={3}
                className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none resize-none"
              />
            </SettingsCard>

            <SettingsCard
              title="System Prompt Injection"
              description="Injected verbatim as the outer identity/tone frame ahead of the task-specific system prompt"
            >
              <textarea
                value={form.systemPromptInjection}
                onChange={(e) => setForm((f) => ({ ...f, systemPromptInjection: e.target.value }))}
                rows={5}
                className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm font-mono text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none resize-none"
              />
            </SettingsCard>

            <SettingsCard
              title="Live Preview"
              description="How this persona modifies a sample prompt"
            >
              <pre className="whitespace-pre-wrap text-xs font-mono text-text-secondary bg-surface p-md rounded-sm border border-border">
                {form.systemPromptInjection}
                {'\n\n---\n\n'}
                {
                  'You are an expert prompt engineer. Enhance this prompt: "Write a function that sorts a list."'
                }
              </pre>
            </SettingsCard>

            <SettingsCard
              title="Actions"
              description="Set as default, duplicate, or delete this persona"
            >
              <div className="flex items-center gap-sm flex-wrap">
                <div className="flex items-center gap-sm mr-auto">
                  <span className="text-sm text-text-secondary">Set as Default</span>
                  <ToggleSwitch
                    checked={selectedPersona.isDefault}
                    onChange={() => handleSetDefault(selectedPersona.id)}
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="h-9 px-md rounded-sm text-sm bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer inline-flex items-center gap-xs"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={() => handleDuplicate(selectedPersona)}
                  className="h-9 px-md rounded-sm text-sm bg-surface-elevated border border-border text-text-primary hover:bg-surface-card-hover transition-colors cursor-pointer"
                >
                  Duplicate
                </button>
                {!selectedPersona.isBuiltin && (
                  <button
                    onClick={() => handleDelete(selectedPersona)}
                    className="h-9 px-md rounded-sm text-sm text-error hover:bg-surface-card-hover transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </SettingsCard>
          </>
        )}
      </div>
    </div>
  )
}

function AppearanceSettings({
  settings,
  onSave
}: {
  settings: Record<string, string>
  onSave: (key: string, value: string) => void
}) {
  return (
    <SettingsCard title="Theme" description="Choose the application appearance">
      <div className="flex gap-sm">
        {(['dark', 'light', 'system'] as const).map((theme) => (
          <button
            key={theme}
            onClick={() => onSave('theme', theme)}
            className={`flex-1 h-9 px-4 rounded-full text-sm capitalize transition-all duration-[160ms] ease-standard active:scale-98 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none select-none ${
              (settings.theme || 'system') === theme
                ? 'bg-primary text-text-inverse font-medium'
                : 'bg-pill-bg text-text-primary hover:bg-pill-bg-hover'
            }`}
          >
            {theme}
          </button>
        ))}
      </div>
    </SettingsCard>
  )
}

function PrivacySettings({
  settings,
  onSave
}: {
  settings: Record<string, string>
  onSave: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <SettingsCard title="Data Retention" description="How long to keep prompt history">
        <select
          value={settings.data_retention_days || '-1'}
          onChange={(e) => onSave('data_retention_days', e.target.value)}
          className="w-full bg-surface-elevated border border-border rounded-sm px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none hover:border-text-secondary transition-colors"
        >
          <option value="-1">Forever</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Analytics" description="Anonymous usage statistics">
        <ToggleSwitch
          checked={settings.analytics_enabled === 'true'}
          onChange={(checked) => onSave('analytics_enabled', String(checked))}
        />
      </SettingsCard>
    </div>
  )
}

// ----- Shared Components -----

function SettingsCard({
  title,
  description,
  children
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-xl shadow-card">
      <div className="mb-md">
        <h3 className="text-md font-medium text-text-primary font-sans">{title}</h3>
        <p className="text-xs text-text-secondary mt-xs font-sans">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-all duration-[160ms] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked
          ? 'bg-primary border-primary hover:bg-primary-hover'
          : 'bg-pill-bg border-border hover:bg-pill-bg-hover'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-[160ms] ease-standard ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
