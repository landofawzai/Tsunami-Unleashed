'use client'

// Template Library Page
// Browse, create, and use message templates

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const TYPE_BADGES: Record<string, { variant: 'info' | 'purple' | 'error' | 'orange' | 'success' | 'warning'; label: string }> = {
  update: { variant: 'info', label: 'Update' },
  prayer: { variant: 'purple', label: 'Prayer' },
  urgent: { variant: 'error', label: 'Urgent' },
  field_notice: { variant: 'orange', label: 'Field Notice' },
  announcement: { variant: 'success', label: 'Announcement' },
  welcome: { variant: 'warning', label: 'Welcome' },
}

export default function TemplatesPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('update')
  const [newBody, setNewBody] = useState('')
  const [createError, setCreateError] = useState('')

  const params = new URLSearchParams()
  if (typeFilter) params.set('type', typeFilter)

  const { data, error, mutate } = useSWR(
    `/api/templates?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const handleCreate = async () => {
    if (!newName.trim() || !newBody.trim()) {
      setCreateError('Name and body are required')
      return
    }
    try {
      setCreateError('')
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          body: newBody,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setNewName('')
      setNewType('update')
      setNewBody('')
      setShowCreate(false)
      mutate()
    } catch (err: any) {
      setCreateError(err.message)
    }
  }

  const handleUseTemplate = (template: any) => {
    // Navigate to new campaign page with template body as a URL param
    const params = new URLSearchParams({
      template: template.id,
      type: template.type,
      body: template.body,
    })
    router.push(`/campaigns/new?${params.toString()}`)
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading templates</h1>
      </div>
    )
  }

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message Templates</h1>
          <p className="page-subtitle">Reusable message templates for common communications</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="create-btn">
          {showCreate ? 'Cancel' : '+ Create Template'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create New Template">
          {createError && <p className="form-error">{createError}</p>}
          <div className="create-form">
            <div className="form-row">
              <div className="form-field">
                <label>Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Weekly Ministry Update" />
              </div>
              <div className="form-field">
                <label>Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="update">Update</option>
                  <option value="prayer">Prayer</option>
                  <option value="urgent">Urgent</option>
                  <option value="field_notice">Field Notice</option>
                  <option value="announcement">Announcement</option>
                  <option value="welcome">Welcome</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label>Template Body</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Write your template message. Use [placeholders] for dynamic content..."
                rows={8}
              />
            </div>
            <button onClick={handleCreate} className="save-btn">Create Template</button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="filters">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
          <option value="">All Types</option>
          <option value="update">Update</option>
          <option value="prayer">Prayer</option>
          <option value="urgent">Urgent</option>
          <option value="field_notice">Field Notice</option>
          <option value="announcement">Announcement</option>
          <option value="welcome">Welcome</option>
        </select>
        {data && <span className="result-count">{data.templates?.length || 0} template{data.templates?.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Template List */}
      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading templates...</div>
      ) : data.templates?.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            No templates found. Create your first template.
          </div>
        </Card>
      ) : (
        <div className="template-grid">
          {data.templates.map((template: any) => {
            const typeBadge = TYPE_BADGES[template.type] || TYPE_BADGES.update
            return (
              <Card key={template.id}>
                <div className="template-card">
                  <div className="template-top">
                    <h3 className="template-name">{template.name}</h3>
                    <Badge variant={typeBadge.variant} size="sm">{typeBadge.label}</Badge>
                  </div>
                  <pre className="template-preview">{template.body.substring(0, 200)}{template.body.length > 200 ? '...' : ''}</pre>
                  <div className="template-footer">
                    <span className="usage-count">Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}</span>
                    <button onClick={() => handleUseTemplate(template)} className="use-btn">
                      Use Template
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .templates-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .page-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .create-btn {
          background: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .create-btn:hover { background: #1d4ed8; }
        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin: 0 0 0.75rem 0;
        }
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 0.75rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-field label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        .form-field input, .form-field select, .form-field textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .form-field textarea {
          resize: vertical;
          min-height: 120px;
        }
        .save-btn {
          background: #10b981;
          color: white;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .filters {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
        }
        .result-count {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: auto;
        }
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
        }
        .template-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .template-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .template-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .template-preview {
          font-size: 0.8125rem;
          color: #6b7280;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f9fafb;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 0;
          font-family: inherit;
          line-height: 1.5;
          max-height: 120px;
          overflow: hidden;
        }
        .template-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .usage-count {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .use-btn {
          background: #2563eb;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .use-btn:hover { background: #1d4ed8; }
        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .form-row { grid-template-columns: 1fr; }
          .template-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
