'use client'

// Derivative Detail Page — View, edit, translate, send to distribution

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useState } from 'react'

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

const TRANSLATION_STATUS: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  ai_draft: { variant: 'neutral', label: 'AI Draft' },
  review_pending: { variant: 'warning', label: 'Review Pending' },
  reviewed: { variant: 'info', label: 'Reviewed' },
  approved: { variant: 'success', label: 'Approved' },
  failed: { variant: 'error', label: 'Failed' },
}

export default function DerivativeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const derivativeId = params.id as string
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: derivative, error, mutate } = useSWR(`/api/derivatives/${derivativeId}`, fetcher, {
    refreshInterval: 30000,
  })

  async function handleSave() {
    setSaving(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/derivatives/${derivativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editBody }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditing(false)
      setActionMessage('Derivative updated successfully')
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendToDistribution() {
    setSending(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/derivatives/${derivativeId}/send-to-distribution`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage('Sent to Distribution successfully')
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  async function handleTranslate() {
    setTranslating(true)
    setActionMessage('')
    try {
      const res = await fetch('/api/translations/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ derivativeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Translation queued for ${data.translationsCreated || 'all'} languages`)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setTranslating(false)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading derivative</h1>
      </div>
    )
  }

  if (!derivative) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading derivative...</p>
      </div>
    )
  }

  if (derivative.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Derivative not found</h1>
        <button onClick={() => router.push('/derivatives')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Derivatives
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/derivatives')}>
          ← Back to Derivatives
        </button>
        <div className="header-info">
          <h1 className="page-title">{derivative.title}</h1>
          <div className="header-badges">
            <Badge variant="info">{DERIVATIVE_LABELS[derivative.derivativeType] || derivative.derivativeType}</Badge>
            <Badge variant={derivative.sentToDistribution ? 'success' : 'neutral'}>
              {derivative.sentToDistribution ? 'Distributed' : derivative.status}
            </Badge>
            {derivative.isAiGenerated && <Badge variant="purple" size="sm">AI Generated</Badge>}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.startsWith('Error') ? 'error' : 'success'}`}>
          {actionMessage}
        </div>
      )}

      <div className="detail-grid">
        {/* Main Content */}
        <div className="main-content">
          {/* Body */}
          <Card title="Content" subtitle={`${derivative.wordCount || 0} words`}>
            {editing ? (
              <div className="edit-area">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="edit-textarea"
                  rows={15}
                />
                <div className="edit-actions">
                  <button className="btn save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn cancel" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="body-viewer">
                <pre className="body-text">{derivative.body}</pre>
                <button
                  className="btn edit"
                  onClick={() => { setEditBody(derivative.body); setEditing(true); }}
                >
                  Edit Content
                </button>
              </div>
            )}
          </Card>

          {/* Translations */}
          <Card title="Translations" subtitle={`${derivative.translations.length} translations`}>
            {derivative.translations.length === 0 ? (
              <p className="empty-text">No translations yet. Click "Translate All" to generate.</p>
            ) : (
              <div className="translations-list">
                {derivative.translations.map((t: any) => {
                  const statusBadge = TRANSLATION_STATUS[t.status] || TRANSLATION_STATUS.ai_draft
                  return (
                    <a key={t.id} href={`/translations/${t.id}`} className="translation-item">
                      <div className="translation-info">
                        <span className="translation-lang">{t.targetLanguage.toUpperCase()}</span>
                        <span className="translation-title">{t.title}</span>
                      </div>
                      <div className="translation-meta">
                        <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                        <span className="translation-pass">Pass {t.reviewPass}/3</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Image Preview for quote graphics */}
          {derivative.derivativeType === 'quote_graphic' && derivative.imageUrl && (
            <Card title="Generated Image">
              <div className="image-preview">
                <img src={derivative.imageUrl} alt={derivative.title} className="quote-image" />
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Actions */}
          <Card title="Actions">
            <div className="actions">
              <button
                className="action-btn distribute"
                onClick={handleSendToDistribution}
                disabled={sending || derivative.sentToDistribution}
              >
                {sending ? 'Sending...' : derivative.sentToDistribution ? 'Already Distributed' : 'Send to Distribution'}
              </button>
              <button
                className="action-btn translate"
                onClick={handleTranslate}
                disabled={translating}
              >
                {translating ? 'Translating...' : 'Translate All Languages'}
              </button>
            </div>
          </Card>

          {/* Details */}
          <Card title="Derivative Details">
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Content ID</span>
                <span className="info-value mono">{derivative.contentId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Parent ID</span>
                <span className="info-value mono">{derivative.parentContentId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Type</span>
                <span className="info-value">{DERIVATIVE_LABELS[derivative.derivativeType]}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Format</span>
                <span className="info-value">{derivative.format}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Language</span>
                <span className="info-value">{derivative.language.toUpperCase()}</span>
              </div>
              {derivative.aiModel && (
                <div className="info-row">
                  <span className="info-label">AI Model</span>
                  <span className="info-value" style={{ fontSize: '0.75rem' }}>{derivative.aiModel}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(derivative.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Source Info */}
          {derivative.sourceContent && (
            <Card title="Source">
              <a href={`/sources/${derivative.sourceContent.id}`} className="source-link">
                <p className="source-title">{derivative.sourceContent.title}</p>
                <p className="source-id">{derivative.sourceContent.contentId}</p>
              </a>
            </Card>
          )}
        </aside>
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
        .back-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0;
          margin-bottom: 0.75rem;
        }
        .back-btn:hover { color: #111827; }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }
        .header-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .action-msg {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .action-msg.success { background: #d1fae5; color: #065f46; }
        .action-msg.error { background: #fee2e2; color: #991b1b; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Body viewer */
        .body-viewer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .body-text {
          white-space: pre-wrap;
          font-size: 0.875rem;
          line-height: 1.75;
          color: #374151;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          max-height: 500px;
          overflow-y: auto;
          font-family: inherit;
        }
        .btn {
          padding: 0.5rem 1rem;
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
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Edit area */
        .edit-area {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .edit-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          line-height: 1.75;
          font-family: inherit;
          resize: vertical;
        }
        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Translations */
        .translations-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .translation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s;
        }
        .translation-item:hover { background: #f3f4f6; }
        .translation-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .translation-lang {
          font-size: 0.875rem;
          font-weight: 700;
          color: #8b5cf6;
          min-width: 2.5rem;
        }
        .translation-title {
          font-size: 0.875rem;
          color: #374151;
        }
        .translation-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .translation-pass {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Image preview */
        .image-preview {
          text-align: center;
        }
        .quote-image {
          max-width: 100%;
          border-radius: 8px;
        }

        /* Sidebar */
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .action-btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn.distribute { background: #f97316; color: white; }
        .action-btn.translate { background: #8b5cf6; color: white; }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .info-label {
          font-size: 0.875rem;
          color: #6b7280;
          flex-shrink: 0;
        }
        .info-value {
          font-size: 0.875rem;
          color: #111827;
          text-align: right;
        }
        .info-value.mono {
          font-family: monospace;
          font-size: 0.75rem;
        }
        .source-link {
          text-decoration: none;
          color: inherit;
          display: block;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .source-link:hover { background: #f9fafb; }
        .source-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }
        .source-id {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
          margin: 0;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
