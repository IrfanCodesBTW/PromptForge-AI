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
  analysis: 'text-purple-400',
  translation: 'text-cyan-400',
  editing: 'text-emerald-400',
  conversion: 'text-orange-400',
  coding: 'text-blue-400',
  writing: 'text-pink-400',
  business: 'text-amber-400',
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
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Templates</h1>
          <p className="text-sm text-text-secondary mt-xs">
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-xs px-md py-sm bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors"
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
                className={`p-md rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-surface hover:border-text-muted'
                }`}
              >
                <div className="flex items-start gap-sm">
                  <Icon size={16} className={`mt-px flex-shrink-0 ${colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-text-muted mt-xs truncate">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-xs mt-sm">
                      <span className="text-xs px-xs py-0.5 rounded bg-surface-elevated text-text-muted capitalize">
                        {template.category}
                      </span>
                      {template.isBuiltin && (
                        <span className="text-xs px-xs py-0.5 rounded bg-primary/10 text-primary">
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
            <div className="bg-surface border border-border rounded-lg p-lg">
              <div className="flex items-center justify-between mb-lg">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-sm text-text-secondary mt-xs">
                    {selectedTemplate.description}
                  </p>
                </div>
                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => duplicateTemplate(selectedTemplate)}
                    className="p-sm text-text-muted hover:text-text-primary rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  {!selectedTemplate.isBuiltin && (
                    <button
                      onClick={() => deleteTemplate(selectedTemplate.id)}
                      className="p-sm text-text-muted hover:text-error rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-lg">
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    System Prompt
                  </label>
                  <pre className="mt-sm p-md bg-bg rounded-md text-sm text-text-secondary font-mono whitespace-pre-wrap border border-border leading-relaxed max-h-48 overflow-y-auto">
                    {selectedTemplate.systemPrompt}
                  </pre>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    User Prompt Template
                  </label>
                  <pre className="mt-sm p-md bg-bg rounded-md text-sm text-text-secondary font-mono whitespace-pre-wrap border border-border leading-relaxed">
                    {selectedTemplate.userPromptTemplate}
                  </pre>
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Variables
                    </label>
                    <div className="mt-sm space-y-xs">
                      {selectedTemplate.variables.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between p-sm bg-bg rounded border border-border"
                        >
                          <code className="text-xs text-primary font-mono">{`{{${v.name}}}`}</code>
                          <span className="text-xs text-text-muted">
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
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileText size={48} className="mx-auto text-text-muted mb-md" />
                <p className="text-text-secondary">Select a template to view details</p>
                <p className="text-xs text-text-muted mt-xs">
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
