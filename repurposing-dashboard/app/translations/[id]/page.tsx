'use client'

// Translation Detail Page — Side-by-side view with 3-pass review workflow

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  ai_draft: { variant: 'neutral', label: 'AI Draft' },
  review_pending: { variant: 'warning', label: 'Review Pending' },
  reviewed: { variant: 'info', label: 'Reviewed' },
  approved: { variant: 'success', label: 'Approved' },
  failed: { variant: 'error', label: 'Failed' },
}

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  mai: 'Maithili (मैथिली)',
  en: 'English',
}

const PASS_LABELS: Record<number, string> = {
  1: 'AI Draft',
  2: 'Local Speaker Review',
  3: 'Theological Review',
}

export default function TranslationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const translationId = params.id as string
  const [reviewNotes, setReviewNotes] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [editing, setEditing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: translation, error, mutate } = useSWR(
    `/api/translations/${translationId}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  async function handleReview(action: 'approve' | 'reject' | 'edit') {
    setSubmitting(true)
    setActionMessage('')
    try {
      const payload: any = { action, reviewerNotes: reviewNotes }
      if (action === 'edit') payload.editedBody = editedBody

      const res = await fetch(`/api/translations/${translationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Review submitted: ${action}`)
      setReviewNotes('')
      setEditing(false)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    setSubmitting(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/translations/${translationId}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage('Translation approved!')
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading translation</h1>
      </div>
    )
  }

  if (!translation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading translation...</p>
      </div>
    )
  }

  if (translation.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Translation not found</h1>
        <button onClick={() => router.push('/translations')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Translations
        </button>
      </div>
    )
  }

  const statusBadge = STATUS_BADGES[translation.status] || STATUS_BADGES.ai_draft

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/translations')}>
          ← Back to Translations
        </button>
        <div className="header-info">
          <h1 className="page-title">{translation.title}</h1>
          <div className="header-badges">
            <Badge variant="purple">{LANG_NAMES[translation.targetLanguage] || translation.targetLanguage}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Badge variant="neutral">Pass {translation.reviewPass}/3 — {PASS_LABELS[translation.reviewPass]}</Badge>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.startsWith('Error') ? 'error' : 'success'}`}>
          {actionMessage}
        </div>
      )}

      {/* 3-Pass Progress */}
      <div className="pass-progress">
        {[1, 2, 3].map((pass) => (
          <div key={pass} className={`pass-step ${translation.reviewPass >= pass ? 'completed' : ''} ${translation.reviewPass === pass ? 'current' : ''}`}>
            <div className="pass-circle">{pass}</div>
            <span className="pass-label">{PASS_LABELS[pass]}</span>
          </div>
        ))}
      </div>

      <div className="detail-grid">
        {/* Side by Side */}
        <div className="side-by-side">
          {/* Original */}
          <Card title={`Original (${translation.sourceLanguage.toUpperCase()})`} subtitle={translation.derivative?.title || ''}>
            <pre className="text-viewer">
              {translation.derivative?.body || 'Original text not available'}
            </pre>
          </Card>

          {/* Translation */}
          <Card
            title={`Translation (${translation.targetLanguage.toUpperCase()})`}
            subtitle={LANG_NAMES[translation.targetLanguage] || translation.targetLanguage}
          >
            {editing ? (
              <div className="edit-area">
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="edit-textarea"
                  rows={15}
                />
              </div>
            ) : (
              <pre className="text-viewer">{translation.body}</pre>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Review Actions */}
          {translation.status !== 'approved' && (
            <Card title="Review Actions">
              <div className="review-form">
                <div className="form-group">
                  <label>Reviewer Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this translation..."
                    rows={3}
                    className="review-textarea"
                  />
                </div>
                <div className="review-actions">
                  <button
                    className="action-btn approve-btn"
                    onClick={() => handleReview('approve')}
                    disabled={submitting}
                  >
                    Pass Review
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => {
                      if (!editing) {
                        setEditedBody(translation.body)
                        setEditing(true)
                      } else {
                        handleReview('edit')
                      }
                    }}
                    disabled={submitting}
                  >
                    {editing ? 'Submit Edit' : 'Edit & Submit'}
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={() => handleReview('reject')}
                    disabled={submitting}
                  >
                    Reject (Reset)
                  </button>
                </div>
                {translation.reviewPass >= 2 && translation.status !== 'approved' && (
                  <button
                    className="action-btn final-approve"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    Final Approve
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Translation Info */}
          <Card title="Details">
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Content ID</span>
                <span className="info-value mono">{translation.contentId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Parent ID</span>
                <span className="info-value mono">{translation.parentContentId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Source Lang</span>
                <span className="info-value">{translation.sourceLanguage.toUpperCase()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Target Lang</span>
                <span className="info-value">{LANG_NAMES[translation.targetLanguage]}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Review Pass</span>
                <span className="info-value">{translation.reviewPass}/3</span>
              </div>
              <div className="info-row">
                <span className="info-label">AI Generated</span>
                <span className="info-value">{translation.isAiGenerated ? 'Yes' : 'No'}</span>
              </div>
              {translation.aiModel && (
                <div className="info-row">
                  <span className="info-label">AI Model</span>
                  <span className="info-value" style={{ fontSize: '0.75rem' }}>{translation.aiModel}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(translation.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Reviewer Notes */}
          {translation.reviewerNotes && (
            <Card title="Previous Review Notes">
              <p className="reviewer-notes">{translation.reviewerNotes}</p>
            </Card>
          )}

          {/* Source Link */}
          {translation.derivative?.sourceContent && (
            <Card title="Source">
              <a href={`/sources/${translation.derivative.sourceContent.id}`} className="source-link">
                <p className="source-title">{translation.derivative.sourceContent.title}</p>
                <p className="source-id">{translation.derivative.sourceContent.contentId}</p>
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

        /* 3-Pass Progress */
        .pass-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .pass-step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.4;
        }
        .pass-step.completed { opacity: 1; }
        .pass-step.current { opacity: 1; }
        .pass-circle {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .pass-step.completed .pass-circle {
          background: #10b981;
          color: white;
        }
        .pass-step.current .pass-circle {
          background: #f97316;
          color: white;
        }
        .pass-label {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }

        /* Side by side */
        .side-by-side {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .text-viewer {
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

        /* Sidebar */
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .review-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .review-textarea {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
        }
        .review-actions {
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
        .approve-btn { background: #10b981; color: white; }
        .edit-btn { background: #f59e0b; color: white; }
        .reject-btn { background: #ef4444; color: white; }
        .final-approve { background: #8b5cf6; color: white; margin-top: 0.5rem; }

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
        .reviewer-notes {
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.5;
          background: #fef3c7;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 0;
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
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
          .side-by-side { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .pass-progress { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  )
}
