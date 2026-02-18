'use client'

// Translator Portal — Translation Detail + Edit + Review
// Mobile-first: stacked layout, collapsible original, sticky submit bar
// Desktop: side-by-side original + translation

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi', bn: 'Bengali', mai: 'Maithili', en: 'English',
  ta: 'Tamil', te: 'Telugu', ur: 'Urdu', ar: 'Arabic',
}

const STATUS_INFO: Record<string, { bg: string; text: string; label: string }> = {
  ai_draft: { bg: '#f3f4f6', text: '#374151', label: 'AI Draft' },
  review_pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' },
  reviewed: { bg: '#dbeafe', text: '#1e40af', label: 'Reviewed' },
  approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
  failed: { bg: '#fee2e2', text: '#991b1b', label: 'Failed' },
}

const PASS_LABELS = ['', 'AI Draft', 'Local Review', 'Theological Review']

export default function TranslationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string
  const id = params.id as string

  const [editing, setEditing] = useState(false)
  const [editedBody, setEditedBody] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { data: translation, error, mutate } = useSWR(
    `/api/translate/${id}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: authData } = useSWR('/api/translate/auth/me', fetcher)
  const user = authData?.user
  const isReviewer = user && (user.role === 'reviewer' || user.role === 'admin')

  // Submit an edit (open to anyone when portal is open)
  async function handleSubmitEdit() {
    if (!editedBody.trim()) return
    setSubmitting(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/translate/${id}/submit-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage('Translation updated successfully!')
      setEditing(false)
      mutate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit'
      setActionMessage(`Error: ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit a review action (reviewer/admin only)
  async function handleReview(action: 'approve' | 'reject' | 'edit') {
    setSubmitting(true)
    setActionMessage('')
    try {
      const payload: Record<string, string> = { action }
      if (reviewNotes) payload.reviewerNotes = reviewNotes
      if (action === 'edit') payload.editedBody = editedBody

      const res = await fetch(`/api/translate/${id}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Review: ${action} completed`)
      setReviewNotes('')
      setShowReviewForm(false)
      setEditing(false)
      mutate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      setActionMessage(`Error: ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <div className="error-state">Error loading translation</div>
  if (!translation) return <div className="loading-state">Loading...</div>
  if (translation.error) return <div className="error-state">{translation.error}</div>

  const statusInfo = STATUS_INFO[translation.status] || STATUS_INFO.ai_draft
  const isApproved = translation.status === 'approved'

  return (
    <div className="detail-page">
      {/* Top bar */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => router.push(`/translate/${lang}`)}>
          ←
        </button>
        <div className="header-badges">
          <span className="lang-badge">{LANG_NAMES[translation.targetLanguage] || translation.targetLanguage}</span>
          <span className="status-badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Pass Progress */}
      <div className="pass-bar">
        {[1, 2, 3].map((pass) => (
          <div key={pass} className={`pass-step ${translation.reviewPass >= pass ? 'done' : ''} ${translation.reviewPass === pass ? 'current' : ''}`}>
            <div className="pass-dot">{pass}</div>
            <span className="pass-text">{PASS_LABELS[pass]}</span>
          </div>
        ))}
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className={`msg ${actionMessage.startsWith('Error') ? 'msg-error' : 'msg-success'}`}>
          {actionMessage}
        </div>
      )}

      {/* Title */}
      <h1 className="detail-title">{translation.title}</h1>

      <div className="content-area">
        {/* Original text (collapsible on mobile) */}
        <div className="original-section">
          <button className="original-toggle" onClick={() => setShowOriginal(!showOriginal)}>
            <span>Original ({(translation.sourceLanguage || 'en').toUpperCase()})</span>
            <span className="toggle-arrow">{showOriginal ? '▲' : '▼'}</span>
          </button>
          {showOriginal && (
            <div className="original-text">
              {translation.derivative?.body || 'Original text not available'}
            </div>
          )}
        </div>

        {/* Translation text */}
        <div className="translation-section">
          <div className="section-label">
            Translation ({(translation.targetLanguage || '').toUpperCase()})
          </div>
          {editing ? (
            <textarea
              className="edit-textarea"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={12}
              autoFocus
            />
          ) : (
            <div className="translation-text">
              {translation.body}
            </div>
          )}
        </div>
      </div>

      {/* Edit / Submit controls */}
      {!isApproved && (
        <div className="action-area">
          {!editing ? (
            <button
              className="edit-trigger"
              onClick={() => {
                setEditedBody(translation.body)
                setEditing(true)
              }}
            >
              Improve This Translation
            </button>
          ) : (
            <div className="edit-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-submit"
                onClick={handleSubmitEdit}
                disabled={submitting || editedBody.trim() === translation.body}
              >
                {submitting ? 'Submitting...' : 'Submit Edit'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviewer Notes (previous) */}
      {translation.reviewerNotes && (
        <div className="reviewer-notes">
          <div className="notes-label">Review Notes</div>
          <div className="notes-text">{translation.reviewerNotes}</div>
        </div>
      )}

      {/* Review Controls (only for authenticated reviewers) */}
      {isReviewer && !isApproved && (
        <div className="review-section">
          <button
            className="review-toggle"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Hide Review Controls' : 'Show Review Controls'}
          </button>

          {showReviewForm && (
            <div className="review-form">
              <textarea
                className="review-notes-input"
                placeholder="Add reviewer notes (optional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />

              <div className="review-buttons">
                <button
                  className="btn btn-approve"
                  onClick={() => handleReview('approve')}
                  disabled={submitting}
                >
                  {translation.reviewPass >= 2 ? 'Final Approve' : 'Pass Review'}
                </button>
                <button
                  className="btn btn-review-edit"
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
                  {editing ? 'Submit Review Edit' : 'Edit & Submit'}
                </button>
                <button
                  className="btn btn-reject"
                  onClick={() => handleReview('reject')}
                  disabled={submitting}
                >
                  Reject (Reset to AI Draft)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <div className="detail-info">
        <div className="info-row">
          <span className="info-label">Status</span>
          <span>{statusInfo.label} — Pass {translation.reviewPass}/3</span>
        </div>
        <div className="info-row">
          <span className="info-label">Type</span>
          <span>{translation.derivative?.derivativeType?.replace(/_/g, ' ') || '—'}</span>
        </div>
        {translation.lastEditedBy && (
          <div className="info-row">
            <span className="info-label">Last edited by</span>
            <span>{translation.lastEditedBy}</span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">AI Generated</span>
          <span>{translation.isAiGenerated ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <style jsx>{`
        .detail-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 0 2rem;
        }
        .loading-state,
        .error-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        /* Header */
        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          -webkit-tap-highlight-color: transparent;
        }
        .back-btn:active { background: #f3f4f6; }
        .header-badges {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .lang-badge {
          background: #ede9fe;
          color: #6d28d9;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Pass Progress */
        .pass-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .pass-step {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          opacity: 0.35;
        }
        .pass-step.done { opacity: 1; }
        .pass-step.current { opacity: 1; }
        .pass-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .pass-step.done .pass-dot {
          background: #10b981;
          color: white;
        }
        .pass-step.current .pass-dot {
          background: #8b5cf6;
          color: white;
        }
        .pass-text {
          font-size: 0.65rem;
          color: #6b7280;
          display: none;
        }

        /* Messages */
        .msg {
          margin: 0.75rem 1rem 0;
          padding: 0.625rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .msg-success { background: #d1fae5; color: #065f46; }
        .msg-error { background: #fee2e2; color: #991b1b; }

        /* Title */
        .detail-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          padding: 1rem 1rem 0;
          margin: 0;
          line-height: 1.3;
        }

        /* Content */
        .content-area {
          padding: 0.75rem 1rem;
        }
        .original-section {
          margin-bottom: 0.75rem;
        }
        .original-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }
        .toggle-arrow { font-size: 0.65rem; color: #9ca3af; }
        .original-text {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0 0 8px 8px;
          padding: 1rem;
          font-size: 0.9rem;
          line-height: 1.7;
          color: #374151;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          max-height: 300px;
          overflow-y: auto;
        }
        .section-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .translation-text {
          font-size: 1rem;
          line-height: 1.8;
          color: #111827;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .edit-textarea {
          width: 100%;
          font-size: 1rem;
          line-height: 1.8;
          color: #111827;
          padding: 1rem;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          font-family: inherit;
          resize: vertical;
          min-height: 200px;
          -webkit-appearance: none;
        }
        .edit-textarea:focus {
          outline: none;
          border-color: #6d28d9;
        }

        /* Action area */
        .action-area {
          padding: 0 1rem;
          margin-top: 0.75rem;
        }
        .edit-trigger {
          width: 100%;
          padding: 0.75rem;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          min-height: 48px;
          -webkit-tap-highlight-color: transparent;
          transition: border-color 0.2s, color 0.2s;
        }
        .edit-trigger:active {
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          min-height: 48px;
          -webkit-tap-highlight-color: transparent;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel { background: #f3f4f6; color: #374151; }
        .btn-submit { background: #8b5cf6; color: white; }
        .btn-approve { background: #10b981; color: white; }
        .btn-review-edit { background: #f59e0b; color: white; }
        .btn-reject { background: #ef4444; color: white; }

        /* Reviewer notes */
        .reviewer-notes {
          margin: 0.75rem 1rem 0;
          background: #fef3c7;
          border-radius: 8px;
          padding: 0.75rem;
        }
        .notes-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #92400e;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }
        .notes-text {
          font-size: 0.85rem;
          color: #78350f;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        /* Review section */
        .review-section {
          margin: 0.75rem 1rem 0;
        }
        .review-toggle {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #166534;
          cursor: pointer;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }
        .review-form {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .review-notes-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          -webkit-appearance: none;
        }
        .review-notes-input:focus {
          outline: none;
          border-color: #10b981;
        }
        .review-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Info */
        .detail-info {
          margin: 1rem 1rem 0;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.375rem 0;
          font-size: 0.8rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6b7280; }
        .info-row span:last-child { color: #111827; font-weight: 500; text-transform: capitalize; }

        /* Desktop enhancements */
        @media (min-width: 768px) {
          .detail-page { padding: 1rem 1rem 2rem; }
          .detail-header { border-radius: 12px 12px 0 0; }
          .pass-text { display: inline; }
          .pass-bar { gap: 1.5rem; }
          .content-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .original-section { margin-bottom: 0; }
          .original-toggle { display: none; }
          .original-text {
            display: block !important;
            border-radius: 8px;
            max-height: 600px;
          }
          .review-buttons { flex-direction: row; }
        }
      `}</style>
    </div>
  )
}
