// ====================================================
// PromptForge AI — Settings Page
// ====================================================

import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, CheckCircle, Zap, Globe, Keyboard, Palette, Shield } from 'lucide-react'
import { useInvoke } from '../hooks/useIPC'
import { useAppStore } from '../stores/appStore'
import { IPC_CHANNELS } from '../../../shared/constants'
import { showToast } from '../components/ui/Toast'
import type { ThemeMode } from '../../../shared/types'

type SettingsSection = 'general' | 'providers' | 'hotkeys' | 'appearance' | 'privacy'

const sections = [
  { id: 'general' as const, label: 'General', icon: Zap },
  { id: 'providers' as const, label: 'Providers', icon: Globe },
  { id: 'hotkeys' as const, label: 'Hotkeys', icon: Keyboard },
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
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-xs">
            Configure PromptForge AI to your preferences
          </p>
        </div>
      </div>

      <div className="flex gap-lg">
        {/* Section tabs */}
        <nav className="w-40 flex-shrink-0 space-y-xs">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-sm px-md py-sm rounded-md text-sm transition-colors ${
                activeSection === id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-lg">
          {activeSection === 'general' && (
            <GeneralSettings settings={settings} onSave={saveSetting} />
          )}
          {activeSection === 'providers' && (
            <ProviderSettings settings={settings} providers={providers} invoke={invoke} onReload={loadProviders} />
          )}
          {activeSection === 'hotkeys' && (
            <HotkeySettings hotkeys={hotkeys} onReload={loadHotkeys} invoke={invoke} />
          )}
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
    <div className="space-y-lg">
      <SettingsCard title="Default Provider" description="Choose the AI provider used for enhancements">
        <select
          value={settings.defaultProvider || 'ollama'}
          onChange={(e) => onSave('defaultProvider', e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="ollama">Ollama (Local)</option>
          <option value="groq">Groq (Cloud)</option>
          <option value="openai">OpenAI (Cloud)</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Temperature" description="Controls randomness (0.0 = deterministic, 2.0 = creative)">
        <div className="flex items-center gap-md">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature || '0.7'}
            onChange={(e) => onSave('temperature', e.target.value)}
            className="flex-1 accent-primary"
          />
          <span className="text-sm text-text-secondary w-10 text-right">
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
          className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
      </SettingsCard>

      <SettingsCard title="Auto-Paste" description="Automatically paste enhanced text after processing">
        <ToggleSwitch
          checked={settings.clipboard_auto_paste !== 'false'}
          onChange={(checked) => onSave('clipboard_auto_paste', String(checked))}
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
    const provInfo = provList.find(p => p.name === selectedProvider)
    
    setLoadingModels(true)
    invoke(IPC_CHANNELS.PROVIDER_MODELS, { provider: selectedProvider }).then((res) => {
      const m = res as string[]
      setModels(m)
      if (provInfo?.default_model && m.includes(provInfo.default_model)) {
        setSelectedModel(provInfo.default_model)
      } else if (m.length > 0) {
        setSelectedModel(m[0])
      }
    }).finally(() => {
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
    <div className="space-y-lg">
      <SettingsCard title="AI Providers" description="Configure API keys for cloud providers">
        <div className="space-y-md">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
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
              className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
            />
          )}

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
            disabled={loadingModels}
          >
            {loadingModels && <option value="">Loading models...</option>}
            {!loadingModels && models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="flex gap-sm">
            <button
              onClick={testProvider}
              disabled={testing}
              className="flex items-center gap-xs px-md py-sm bg-surface-elevated rounded-md text-sm text-text-primary hover:bg-border transition-colors disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={saveProvider}
              className="flex items-center gap-xs px-md py-sm bg-primary rounded-md text-sm text-white hover:bg-primary-hover transition-colors"
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
            <div key={p.name} className="flex items-center justify-between py-xs">
              <div className="flex items-center gap-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    p.is_active ? 'bg-success' : 'bg-text-muted'
                  }`}
                />
                <span className="text-sm text-text-primary capitalize">{p.name}</span>
              </div>
              <span className="text-xs text-text-muted">{p.type}</span>
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
        showToast({ type: 'success', title: 'Hotkey Updated', message: `Registered ${newBinding} for ${hk.action}` })
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
    <SettingsCard title="Global Hotkeys" description="Keyboard shortcuts for enhancement modes. Click the hotkey box to record a new shortcut.">
      <div className="space-y-md">
        {(hotkeys as { id: string; action: string; keybinding: string; is_active: number }[]).map((hk) => {
          const isRecording = recordingId === hk.id
          return (
            <div key={hk.action} className="flex items-center justify-between p-md bg-surface border border-border rounded-lg">
              <div>
                <span className="text-sm font-medium text-text-primary capitalize block">{hk.action}</span>
                <span className="text-xs text-text-muted">Trigger the {hk.action} prompt template</span>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => isRecording ? cancelRecording() : startRecording(hk.id)}
                  onKeyDown={(e) => isRecording && handleKeyDown(e, hk)}
                  className={`px-md py-sm rounded-md text-xs font-mono border transition-all min-w-[120px] text-center ${
                    isRecording 
                      ? 'bg-primary border-primary text-white animate-pulse' 
                      : 'bg-surface-elevated border-border text-text-secondary hover:bg-border'
                  }`}
                >
                  {isRecording ? 'Press keys...' : hk.keybinding}
                </button>
                <ToggleSwitch
                  checked={hk.is_active === 1}
                  onChange={() => toggleHotkey(hk)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </SettingsCard>
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
            className={`flex-1 px-md py-sm rounded-md text-sm capitalize transition-colors ${
              (settings.theme || 'system') === theme
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated'
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
    <div className="space-y-lg">
      <SettingsCard title="Data Retention" description="How long to keep prompt history">
        <select
          value={settings.data_retention_days || '-1'}
          onChange={(e) => onSave('data_retention_days', e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
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
    <div className="bg-surface rounded-lg border border-border p-lg">
      <div className="mb-md">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted mt-xs">{description}</p>
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
