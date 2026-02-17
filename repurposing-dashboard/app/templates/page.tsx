'use client'

// Templates Page — AI prompt template management

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DERIVATIVE_LABELS: Record<string, string> = {
  blog_post: 'Blog Post',
  social_quote: 'Social Quote',
  thread_summary: 'Thread Summary',
  study_guide: 'Study Guide',
  newsletter_excerpt: 'Newsletter',
  audio_transcription: 'Transcription',
  video_clip_meta: 'Video Clip',
  quote_graphic: 'Quote Graphic',
}

export default function TemplatesPage() {
  const [filterType, setFilterType] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [actionMessage, setActionMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams()
  if (filterType) params.set('derivativeType', filterType)

  const { data, mutate } = useSWR(`/api/templates?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  function startEdit(template: any) {
    setEditingId(template.id)
    setEditData({
      name: template.name,
      description: template.description || '',
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      maxTokens: template.maxTokens,
      outputFormat: template.outputFormat,
      isActive: template.isActive,
    })
  }

  async function handleSave() {
    setSaving(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/templates/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditingId(null)
      setActionMessage('Template saved successfully')
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      mutate()
    } catch {
      setActionMessage('Error toggling template')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">{data?.total || 0} AI prompt templates for derivative generation</p>
        </div>
      </div>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.startsWith('Error') ? 'error' : 'success'}`}>
          {actionMessage}
        </div>
      )}

      {/* Filter */}
      <div className="filters">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-input">
          <option value="">All Types</option>
          {Object.entries(DERIVATIVE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      <div className="templates-list">
        {!data ? (
          <Card><p className="empty-text">Loading templates...</p></Card>
        ) : data.templates.length === 0 ? (
          <Card><p className="empty-text">No templates found.</p></Card>
        ) : (
          data.templates.map((template: any) => (
            <Card key={template.id}>
              {editingId === template.id ? (
                /* Edit Mode */
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Tokens</label>
                      <input
                        type="number"
                        value={editData.maxTokens}
                        onChange={(e) => setEditData({ ...editData, maxTokens: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>System Prompt</label>
                    <textarea
                      value={editData.systemPrompt}
                      onChange={(e) => setEditData({ ...editData, systemPrompt: e.target.value })}
                      rows={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>User Prompt Template</label>
                    <textarea
                      value={editData.userPromptTemplate}
                      onChange={(e) => setEditData({ ...editData, userPromptTemplate: e.target.value })}
                      rows={4}
                    />
                    <span className="form-hint">Use {'{title}'}, {'{body}'}, {'{contentType}'} as placeholders</span>
                  </div>
                  <div className="edit-actions">
                    <button className="btn save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="template-card">
                  <div className="template-header">
                    <div className="template-info">
                      <h3 className="template-name">{template.name}</h3>
                      <div className="template-badges">
                        <Badge variant="info" size="sm">
                          {DERIVATIVE_LABELS[template.derivativeType] || template.derivativeType}
                        </Badge>
                        <Badge variant={template.isActive ? 'success' : 'neutral'} size="sm">
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="neutral" size="sm">{template.maxTokens} tokens</Badge>
                        <Badge variant="purple" size="sm">{template.usageCount} uses</Badge>
                      </div>
                    </div>
                    <div className="template-actions">
                      <button className="btn edit" onClick={() => startEdit(template)}>Edit</button>
                      <button
                        className={`btn ${template.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => toggleActive(template.id, template.isActive)}
                      >
                        {template.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                  {template.description && (
                    <p className="template-desc">{template.description}</p>
                  )}
                  <div className="prompt-preview">
                    <div className="prompt-section">
                      <span className="prompt-label">System Prompt:</span>
                      <pre className="prompt-text">{template.systemPrompt.slice(0, 200)}{template.systemPrompt.length > 200 ? '...' : ''}</pre>
                    </div>
                    <div className="prompt-section">
                      <span className="prompt-label">User Template:</span>
                      <pre className="prompt-text">{template.userPromptTemplate.slice(0, 150)}{template.userPromptTemplate.length > 150 ? '...' : ''}</pre>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .page-header {
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .page-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .action-msg {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .action-msg.success { background: #d1fae5; color: #065f46; }
        .action-msg.error { background: #fee2e2; color: #991b1b; }
        .filters {
          margin-bottom: 1.5rem;
        }
        .filter-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Template Card */
        .template-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .template-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .template-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .template-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .template-actions {
          display: flex;
          gap: 0.5rem;
        }
        .template-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        .prompt-preview {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .prompt-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .prompt-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }
        .prompt-text {
          font-size: 0.875rem;
          color: #374151;
          background: #f9fafb;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          white-space: pre-wrap;
          font-family: inherit;
          line-height: 1.5;
          margin: 0;
        }

        /* Buttons */
        .btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn.edit { background: #f3f4f6; color: #374151; }
        .btn.edit:hover { background: #e5e7eb; }
        .btn.save { background: #f97316; color: white; }
        .btn.cancel { background: #f3f4f6; color: #374151; }
        .btn.activate { background: #d1fae5; color: #065f46; }
        .btn.deactivate { background: #fee2e2; color: #991b1b; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Edit Form */
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 0.75rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .form-group input,
        .form-group textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .form-group textarea { resize: vertical; }
        .form-hint {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .template-header { flex-direction: column; gap: 0.75rem; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
