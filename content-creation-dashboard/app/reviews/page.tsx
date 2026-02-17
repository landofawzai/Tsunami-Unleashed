// Reviews Page
// Pending review queue with approve/revise/reject actions

'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', drafting: 'Drafting', recording: 'Recording',
  editing: 'Editing', review: 'Review', approved: 'Approved',
  finalized: 'Finalized', sent_to_repurposing: 'Sent', archived: 'Archived',
}

const REVIEW_BADGES: Record<string, 'success' | 'warning' | 'error'> = {
  approved: 'success', revision_requested: 'warning', rejected: 'error',
}

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState('')

  // Content awaiting review
  const { data: contentData } = useSWR('/api/content?status=review&limit=50', fetcher, {
    refreshInterval: 30000,
  })

  // Past reviews
  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)
  params.set('limit', '50')
  const { data: reviewsData, error } = useSWR(`/api/reviews?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  const pendingItems = contentData?.items || []
  const reviews = reviewsData?.reviews || []

  return (
    <div className="reviews-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">{pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {/* Pending Review Queue */}
      <h2 className="section-title">Review Queue</h2>
      {pendingItems.length === 0 ? (
        <Card><p className="empty-text">No content items awaiting review.</p></Card>
      ) : (
        <div className="queue-list">
          {pendingItems.map((item: any) => (
            <ReviewQueueItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Past Reviews */}
      <h2 className="section-title" style={{ marginTop: '2rem' }}>Review History</h2>
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Decisions</option>
          <option value="approved">Approved</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error ? (
        <Card><p className="error-text">Failed to load reviews</p></Card>
      ) : !reviewsData ? (
        <Card>
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </Card>
      ) : reviews.length === 0 ? (
        <Card><p className="empty-text">No reviews found.</p></Card>
      ) : (
        <div className="reviews-list">
          {reviews.map((review: any) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <span className="reviewer-name">{review.reviewerName}</span>
                <Badge variant={REVIEW_BADGES[review.status] || 'neutral'} size="sm">
                  {review.status === 'revision_requested' ? 'Revisions' : review.status}
                </Badge>
              </div>
              <div className="review-ratings">
                {review.theologicalAccuracy && <span>Theology: {review.theologicalAccuracy}/5</span>}
                {review.clarity && <span>Clarity: {review.clarity}/5</span>}
                {review.productionQuality && <span>Production: {review.productionQuality}/5</span>}
              </div>
              {review.feedback && <p className="review-feedback">{review.feedback}</p>}
              <div className="review-footer">
                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                {review.contentItem && (
                  <a href={`/content/${review.contentItem.id}`} className="review-link">
                    {review.contentItem.title}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .reviews-page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }
        .section-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0; }

        .queue-list { display: flex; flex-direction: column; gap: 1rem; }

        .filters { margin-bottom: 1rem; }
        .filters select {
          padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: white;
        }

        .reviews-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-card {
          background: white; border-radius: 10px; padding: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
        .reviewer-name { font-weight: 600; color: #111827; font-size: 0.9rem; }
        .review-ratings { display: flex; gap: 1rem; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; }
        .review-feedback { font-size: 0.85rem; color: #374151; margin: 0.25rem 0; line-height: 1.5; }
        .review-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.375rem; }
        .review-date { font-size: 0.7rem; color: #9ca3af; }
        .review-link { font-size: 0.8rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .review-link:hover { text-decoration: underline; }

        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) { .reviews-page { padding: 1rem; } }
      `}</style>
    </div>
  )
}

/* Review Queue Item with inline actions */
function ReviewQueueItem({ item }: { item: any }) {
  const [showReview, setShowReview] = useState(false)
  const [reviewerName, setReviewerName] = useState('')
  const [feedback, setFeedback] = useState('')
  const [theologicalAccuracy, setTheologicalAccuracy] = useState('5')
  const [clarity, setClarity] = useState('5')
  const [productionQuality, setProductionQuality] = useState('5')
  const [saving, setSaving] = useState(false)

  async function submitReview(decision: string) {
    if (!reviewerName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId: item.id,
          reviewerName: reviewerName.trim(),
          status: decision,
          feedback: feedback.trim() || undefined,
          theologicalAccuracy: parseInt(theologicalAccuracy),
          clarity: parseInt(clarity),
          productionQuality: parseInt(productionQuality),
        }),
      })
      mutate('/api/content?status=review&limit=50')
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/reviews'), undefined, { revalidate: true })
      setShowReview(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="queue-item">
      <div className="queue-header">
        <div className="queue-info">
          <span className="queue-id">{item.contentId}</span>
          <h3 className="queue-title">{item.title}</h3>
          <div className="queue-meta">
            <span>{item.contentType}</span>
            <span>{item.mediaType}</span>
            {item.assignedTo && <span>by {item.assignedTo}</span>}
          </div>
        </div>
        <button className="btn-review" onClick={() => setShowReview(!showReview)}>
          {showReview ? 'Cancel' : 'Review'}
        </button>
      </div>

      {showReview && (
        <div className="review-form">
          <div className="form-row">
            <div className="form-group">
              <label>Your Name *</label>
              <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Reviewer name..." />
            </div>
          </div>
          <div className="form-row ratings">
            <div className="form-group">
              <label>Theological Accuracy</label>
              <select value={theologicalAccuracy} onChange={(e) => setTheologicalAccuracy(e.target.value)}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Clarity</label>
              <select value={clarity} onChange={(e) => setClarity(e.target.value)}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Production Quality</label>
              <select value={productionQuality} onChange={(e) => setProductionQuality(e.target.value)}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Review feedback..." />
          </div>
          <div className="decision-buttons">
            <button className="btn-approve" onClick={() => submitReview('approved')} disabled={saving || !reviewerName.trim()}>
              Approve
            </button>
            <button className="btn-revise" onClick={() => submitReview('revision_requested')} disabled={saving || !reviewerName.trim()}>
              Request Revision
            </button>
            <button className="btn-reject" onClick={() => submitReview('rejected')} disabled={saving || !reviewerName.trim()}>
              Reject
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .queue-item {
          background: white; border-radius: 12px; padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;
        }
        .queue-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .queue-info { flex: 1; }
        .queue-id { font-size: 0.7rem; color: #9ca3af; font-family: monospace; }
        .queue-title { margin: 0.25rem 0 0.375rem 0; font-size: 1rem; font-weight: 600; color: #111827; }
        .queue-meta { display: flex; gap: 0.75rem; font-size: 0.8rem; color: #6b7280; }
        .btn-review {
          background: #f59e0b; color: white; border: none; padding: 0.5rem 1rem;
          border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }

        .review-form { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 0.75rem; }
        .form-row { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
        .form-row.ratings { grid-template-columns: 1fr 1fr 1fr; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; color: #111827;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: #10b981;
        }

        .decision-buttons { display: flex; gap: 0.5rem; }
        .btn-approve {
          background: #10b981; color: white; border: none; padding: 0.5rem 1rem;
          border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }
        .btn-revise {
          background: #f59e0b; color: white; border: none; padding: 0.5rem 1rem;
          border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }
        .btn-reject {
          background: #ef4444; color: white; border: none; padding: 0.5rem 1rem;
          border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }
        .btn-approve:disabled, .btn-revise:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 640px) {
          .queue-header { flex-direction: column; gap: 0.75rem; }
          .form-row.ratings { grid-template-columns: 1fr; }
          .decision-buttons { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
