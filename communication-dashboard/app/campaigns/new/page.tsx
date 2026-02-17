'use client'

// Campaign Composer Page
// Create new campaigns with AI-powered channel adaptation

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const CHANNELS = [
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'sms', label: 'SMS', icon: '📱' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'signal', label: 'Signal', icon: '🔒' },
  { id: 'social_media', label: 'Social Media', icon: '📣' },
]

const TYPES = [
  { id: 'update', label: 'Ministry Update', color: 'info' as const },
  { id: 'prayer', label: 'Prayer Request', color: 'purple' as const },
  { id: 'urgent', label: 'Urgent Alert', color: 'error' as const },
  { id: 'field_notice', label: 'Field Notice', color: 'orange' as const },
  { id: 'announcement', label: 'Announcement', color: 'success' as const },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('update')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [isUrgent, setIsUrgent] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email'])
  const [saving, setSaving] = useState(false)
  const [adapting, setAdapting] = useState(false)
  const [adaptResult, setAdaptResult] = useState<{ versionsCreated: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [previewVersions, setPreviewVersions] = useState<any[]>([])
  const [activePreviewTab, setActivePreviewTab] = useState('email')

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message body are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          body,
          priority,
          isUrgent,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      const campaign = await res.json()
      setCreatedId(campaign.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAdapt = async () => {
    if (!createdId) return
    if (selectedChannels.length === 0) {
      setError('Select at least one channel')
      return
    }

    setAdapting(true)
    setError('')
    setAdaptResult(null)

    try {
      const res = await fetch(`/api/campaigns/${createdId}/adapt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: selectedChannels,
          languages: ['en'],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to adapt campaign')
      }

      const result = await res.json()
      setAdaptResult(result)

      // Load preview versions
      const detailRes = await fetch(`/api/campaigns/${createdId}`)
      if (detailRes.ok) {
        const detail = await detailRes.json()
        setPreviewVersions(detail.versions || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdapting(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!createdId) return

    try {
      const res = await fetch(`/api/campaigns/${createdId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'dashboard' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve')
      }

      router.push(`/campaigns/${createdId}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="composer-page">
      <div className="page-header">
        <h1 className="page-title">New Campaign</h1>
        <p className="page-subtitle">Compose once, adapt for every channel</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">x</button>
        </div>
      )}

      <div className="composer-grid">
        {/* Left: Compose */}
        <div className="compose-column">
          <Card title="Compose" subtitle="Write your master message">
            {/* Type Selector */}
            <div className="field-group">
              <label className="field-label">Type</label>
              <div className="type-selector">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={`type-btn ${type === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setType(t.id)
                      if (t.id === 'urgent') setIsUrgent(true)
                      else setIsUrgent(false)
                    }}
                    disabled={!!createdId}
                  >
                    <Badge variant={t.color} size="sm">{t.label}</Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="field-group">
              <label className="field-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. February Ministry Update"
                className="field-input"
                disabled={!!createdId}
              />
            </div>

            {/* Body */}
            <div className="field-group">
              <label className="field-label">Message Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here. This master version will be adapted for each channel by AI..."
                className="field-textarea"
                rows={10}
                disabled={!!createdId}
              />
              <span className="char-count">{body.length} characters</span>
            </div>

            {/* Priority */}
            <div className="field-group">
              <label className="field-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="field-select"
                disabled={!!createdId}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {!createdId ? (
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !body.trim()}
                className="primary-btn"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            ) : (
              <div className="saved-notice">
                <Badge variant="success" size="md">Draft Saved</Badge>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Channel Adaptation */}
        <div className="adapt-column">
          {/* Channel Selector */}
          <Card title="Channels" subtitle="Select delivery channels">
            <div className="channel-grid">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  className={`channel-btn ${selectedChannels.includes(ch.id) ? 'selected' : ''}`}
                  onClick={() => toggleChannel(ch.id)}
                >
                  <span className="channel-icon">{ch.icon}</span>
                  <span className="channel-label">{ch.label}</span>
                </button>
              ))}
            </div>

            {createdId && (
              <button
                onClick={handleAdapt}
                disabled={adapting || selectedChannels.length === 0}
                className="adapt-btn"
              >
                {adapting ? 'Adapting with AI...' : 'Adapt for Channels'}
              </button>
            )}

            {adaptResult && (
              <div className="adapt-result">
                <Badge variant="success" size="sm">
                  {adaptResult.versionsCreated} version{adaptResult.versionsCreated !== 1 ? 's' : ''} created
                </Badge>
                {adaptResult.errors.length > 0 && (
                  <div className="adapt-errors">
                    {adaptResult.errors.map((err, i) => (
                      <p key={i} className="adapt-error">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Channel Previews */}
          {previewVersions.length > 0 && (
            <Card title="Channel Previews" subtitle="Review AI-adapted versions">
              <div className="preview-tabs">
                {selectedChannels.map((ch) => (
                  <button
                    key={ch}
                    className={`preview-tab ${activePreviewTab === ch ? 'active' : ''}`}
                    onClick={() => setActivePreviewTab(ch)}
                  >
                    {ch.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="preview-content">
                {previewVersions
                  .filter((v) => v.channel === activePreviewTab)
                  .map((version, i) => (
                    <div key={i} className="preview-version">
                      {version.subject && (
                        <div className="preview-subject">
                          <strong>Subject:</strong> {version.subject}
                        </div>
                      )}
                      <pre className="preview-body">{version.body}</pre>
                      {version.isAiGenerated && (
                        <Badge variant="info" size="sm">AI Generated</Badge>
                      )}
                    </div>
                  ))}
                {previewVersions.filter((v) => v.channel === activePreviewTab).length === 0 && (
                  <p className="no-preview">No version for this channel yet</p>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          {createdId && previewVersions.length > 0 && (
            <Card>
              <div className="action-buttons">
                <button
                  onClick={handleSubmitForApproval}
                  className="approve-btn"
                >
                  Approve & Continue
                </button>
                <button
                  onClick={() => router.push(`/campaigns/${createdId}`)}
                  className="secondary-btn"
                >
                  View Campaign Detail
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <style jsx>{`
        .composer-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
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
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .error-banner {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }
        .error-close {
          background: none;
          border: none;
          color: #991b1b;
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.25rem;
        }
        .composer-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1.5rem;
        }
        .compose-column, .adapt-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .field-group {
          margin-bottom: 1.25rem;
        }
        .field-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .type-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .type-btn {
          background: none;
          border: 2px solid transparent;
          padding: 0.25rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .type-btn.active {
          border-color: #2563eb;
        }
        .type-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111827;
          box-sizing: border-box;
        }
        .field-input:focus, .field-textarea:focus, .field-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .field-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111827;
          font-family: inherit;
          resize: vertical;
          min-height: 150px;
          box-sizing: border-box;
        }
        .char-count {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
          display: block;
          text-align: right;
        }
        .field-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111827;
          background: white;
        }
        .primary-btn {
          background: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }
        .primary-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .saved-notice {
          text-align: center;
          padding: 0.5rem 0;
        }
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .channel-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .channel-btn.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }
        .channel-icon {
          font-size: 1.25rem;
        }
        .channel-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .adapt-btn {
          background: #7c3aed;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }
        .adapt-btn:hover:not(:disabled) {
          background: #6d28d9;
        }
        .adapt-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .adapt-result {
          margin-top: 0.75rem;
        }
        .adapt-errors {
          margin-top: 0.5rem;
        }
        .adapt-error {
          font-size: 0.75rem;
          color: #ef4444;
          margin: 0.25rem 0;
        }
        .preview-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .preview-tab {
          padding: 0.5rem 0.75rem;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .preview-tab.active {
          background: #2563eb;
          color: white;
        }
        .preview-content {
          min-height: 100px;
        }
        .preview-version {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .preview-subject {
          font-size: 0.875rem;
          color: #374151;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
        }
        .preview-body {
          font-size: 0.8125rem;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin: 0;
          font-family: inherit;
          line-height: 1.5;
        }
        .no-preview {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .approve-btn {
          background: #10b981;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .approve-btn:hover {
          background: #059669;
        }
        .secondary-btn {
          background: white;
          color: #374151;
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .secondary-btn:hover {
          background: #f9fafb;
        }
        @media (max-width: 1024px) {
          .composer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
