// ====================================================
// PromptForge AI — Templates Page
// ====================================================

import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Code, PenTool, BookOpen, Briefcase, Copy, Edit, Trash2 } from 'lucide-react'
import { useInvoke } from '../hooks/useIPC'
import { IPC_CHANNELS } from '../../../shared/constants'
import { showToast } from '../components/ui/Toast'
import type { Template } from '../../../shared/types'

const categoryIcons: Record<string, typeof FileText> = {
  enhancement: FileText,
  expansion: FileText,
  compression: FileText,
  analysis: BookOpen,
  translation: PenTool,
  editing: Edit,
  conversion: Code,
  coding: Code,
  writing: PenTool,
  business: Briefcase,
  general: FileText
}

const categoryColors: Record<string, string> = {
  enhancement: 'text-primary',
  expansion: 'text-success',
  compression: 'text-warning',
  analysis: 'text-lavender-text',
  translation: 'text-text-secondary',
  editing: 'text-text-secondary',
  conversion: 'text-text-secondary',
  coding: 'text-text-secondary',
  writing: 'text-text-secondary',
  business: 'text-text-secondary',
  general: 'text-text-secondary'
}

export function Templates(): JSX.Element {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const invoke = useInvoke()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = useCallback(async () => {
    const list = (await invoke(IPC_CHANNELS.TEMPLATE_LIST)) as Template[]
    setTemplates(list)
  }, [invoke])

  const duplicateTemplate = async (template: Template) => {
    await invoke(IPC_CHANNELS.TEMPLATE_CREATE, {
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      variables: JSON.stringify(template.variables),
      isBuiltin: false
    })
    loadTemplates()
    showToast({ type: 'success', title: 'Template duplicated' })
  }

  const deleteTemplate = async (id: string) => {
    if (confirm('Delete this template?')) {
      await invoke(IPC_CHANNELS.TEMPLATE_DELETE, id)
      loadTemplates()
      if (selectedTemplate?.id === id) setSelectedTemplate(null)
      showToast({ type: 'success', title: 'Template deleted' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg select-none">
        <div>
          <h1 className="text-xl font-medium font-serif text-text-primary">Templates</h1>
          <p className="text-sm text-text-secondary mt-xs font-sans">
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-xs h-9 px-4 bg-primary text-text-inverse rounded-full text-sm hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-[160ms] ease-standard active:scale-98 select-none"
        >
          <Plus size={14} />
          New Template
        </button>
      </div>

      <div className="flex gap-lg flex-1 overflow-hidden">
        {/* Template List */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-sm">
          {templates.map((template) => {
            const Icon = categoryIcons[template.category] || FileText
            const colorClass = categoryColors[template.category] || 'text-text-secondary'

            return (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-md rounded-sm border cursor-pointer transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-mint-100/10 shadow-card'
                    : 'border-border bg-surface-elevated hover:border-text-secondary hover:shadow-card'
                }`}
              >
                <div className="flex items-start gap-sm">
                  <Icon size={16} className={`mt-px flex-shrink-0 ${colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate font-sans">
                      {template.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-xs truncate font-sans">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-xs mt-sm select-none">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pill-bg text-text-secondary font-medium capitalize font-sans">
                        {template.category}
                      </span>
                      {template.isBuiltin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium font-sans">
                          Built-in
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Template Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedTemplate ? (
            <div className="bg-surface-elevated border border-border rounded-lg p-xl shadow-card font-sans">
              <div className="flex items-center justify-between mb-lg select-none">
                <div>
                  <h2 className="text-lg font-medium font-serif text-text-primary">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-sm text-text-secondary mt-xs">
                    {selectedTemplate.description}
                  </p>
                </div>
                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => duplicateTemplate(selectedTemplate)}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-card-hover rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    title="Duplicate"
                    aria-label="Duplicate template"
                  >
                    <Copy size={16} />
                  </button>
                  {!selectedTemplate.isBuiltin && (
                    <button
                      onClick={() => deleteTemplate(selectedTemplate.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-error/5 rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
                      title="Delete"
                      aria-label="Delete template"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-lg">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-sans select-none">
                    System Prompt
                  </label>
                  <pre className="mt-sm p-md bg-surface rounded-sm text-sm text-text-primary font-mono whitespace-pre-wrap border border-border leading-relaxed max-h-48 overflow-y-auto">
                    {selectedTemplate.systemPrompt}
                  </pre>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-sans select-none">
                    User Prompt Template
                  </label>
                  <pre className="mt-sm p-md bg-surface rounded-sm text-sm text-text-primary font-mono whitespace-pre-wrap border border-border leading-relaxed">
                    {selectedTemplate.userPromptTemplate}
                  </pre>
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-sans select-none">
                      Variables
                    </label>
                    <div className="mt-sm space-y-xs">
                      {selectedTemplate.variables.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between p-sm bg-surface rounded-xs border border-border"
                        >
                          <code className="text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded font-mono">{`{{${v.name}}}`}</code>
                          <span className="text-xs text-text-secondary font-sans font-medium">
                            {v.type} · default: {v.default || '(none)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center bg-surface-elevated border border-border rounded-lg p-xl shadow-card select-none">
              <div>
                <FileText size={24} className="mx-auto text-text-secondary mb-md" />
                <p className="text-sm font-medium text-text-primary font-sans">Select a template to view details</p>
                <p className="text-xs text-text-secondary mt-xs font-sans">
                  Built-in templates are read-only. Duplicate to customize.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
