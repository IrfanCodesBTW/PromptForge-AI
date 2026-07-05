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

        {/* Content */}
        <div className="flex-1 space-y-lg">
          {activeSection === 'general' && (
            <GeneralSettings settings={settings} onSave={saveSetting} />
          )}
          {activeSection === 'providers' && (
            <ProviderSettings providers={providers} invoke={invoke} onReload={loadProviders} />
          )}
          {activeSection === 'hotkeys' && (
            <HotkeySettings hotkeys={hotkeys} />
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

      <SettingsCard title="Default Model" description="Model to use with the selected provider">
        <input
          type="text"
          value={settings.defaultModel || 'llama3.1'}
          onChange={(e) => onSave('defaultModel', e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="e.g., llama3.1, gpt-4o"
        />
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
  providers,
  invoke,
  onReload
}: {
  providers: unknown[]
  invoke: ReturnType<typeof useInvoke>
  onReload: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('groq')
  const [testing, setTesting] = useState(false)

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

  return (
    <div className="space-y-lg">
      <SettingsCard title="AI Providers" description="Configure API keys for cloud providers">
        <div className="space-y-md">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter</option>
          </select>

          <input
            type="password"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-md py-sm text-sm text-text-primary outline-none focus:border-primary"
          />

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

function HotkeySettings({ hotkeys }: { hotkeys: unknown[] }) {
  return (
    <SettingsCard title="Global Hotkeys" description="Keyboard shortcuts for enhancement modes">
      <div className="space-y-sm">
        {(hotkeys as { action: string; keybinding: string; is_active: number }[]).map((hk) => (
          <div key={hk.action} className="flex items-center justify-between py-xs">
            <span className="text-sm text-text-primary capitalize">{hk.action}</span>
            <kbd className="px-sm py-xs bg-surface rounded text-xs text-text-secondary font-mono border border-border">
              {hk.keybinding}
            </kbd>
          </div>
        ))}
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
