'use client'

// Source Detail Page — View source content, transcription, derivatives, jobs
// Trigger repurpose action from here

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  pending: { variant: 'neutral', label: 'Pending' },
  processing: { variant: 'orange', label: 'Processing' },
  ready: { variant: 'success', label: 'Ready' },
  failed: { variant: 'error', label: 'Failed' },
}

const JOB_STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  queued: { variant: 'neutral', label: 'Queued' },
  processing: { variant: 'orange', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
}

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

export default function SourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sourceId = params.id as string
  const [tab, setTab] = useState<'derivatives' | 'transcription' | 'jobs'>('derivatives')
  const [repurposing, setRepurposing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const { data: source, error, mutate } = useSWR(`/api/sources/${sourceId}`, fetcher, {
    refreshInterval: 30000,
  })

  async function handleRepurpose() {
    setRepurposing(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/sources/${sourceId}/repurpose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Repurpose queued: ${data.expectedDerivatives} derivatives + ${data.expectedTranslations} translations`)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setRepurposing(false)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading source</h1>
        <p style={{ color: '#6b7280' }}>{error.message}</p>
      </div>
    )
  }

  if (!source) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading source...</p>
      </div>
    )
  }

  if (source.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Source not found</h1>
        <button onClick={() => router.push('/sources')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Sources
        </button>
      </div>
    )
  }

  const statusBadge = STATUS_BADGES[source.status] || STATUS_BADGES.pending

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push('/sources')}>
          ← Back to Sources
        </button>
        <div className="header-info">
          <h1 className="page-title">{source.title}</h1>
          <div className="header-badges">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Badge variant="neutral">{source.contentType}</Badge>
            <Badge variant="info">{source.mediaType}</Badge>
            <Badge variant="neutral" size="sm">{source.language.toUpperCase()}</Badge>
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
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${tab === 'derivatives' ? 'active' : ''}`}
              onClick={() => setTab('derivatives')}
            >
              Derivatives ({source.derivatives.length})
            </button>
            <button
              className={`tab ${tab === 'transcription' ? 'active' : ''}`}
              onClick={() => setTab('transcription')}
            >
              Transcription
            </button>
            <button
              className={`tab ${tab === 'jobs' ? 'active' : ''}`}
              onClick={() => setTab('jobs')}
            >
              Jobs ({source.processingJobs.length})
            </button>
          </div>

          {/* Derivatives Tab */}
          {tab === 'derivatives' && (
            <Card>
              {source.derivatives.length === 0 ? (
                <p className="empty-text">No derivatives yet. Click "Repurpose" to generate.</p>
              ) : (
                <div className="derivatives-list">
                  {source.derivatives.map((d: any) => (
                    <a key={d.id} href={`/derivatives/${d.id}`} className="derivative-item">
                      <div className="derivative-info">
                        <span className="derivative-title">{d.title}</span>
                        <div className="derivative-badges">
                          <Badge variant="info" size="sm">{DERIVATIVE_LABELS[d.derivativeType] || d.derivativeType}</Badge>
                          <Badge variant={d.sentToDistribution ? 'success' : 'neutral'} size="sm">
                            {d.sentToDistribution ? 'Distributed' : 'Draft'}
                          </Badge>
                          {d._count.translations > 0 && (
                            <Badge variant="purple" size="sm">{d._count.translations} translations</Badge>
                          )}
                        </div>
                      </div>
                      <span className="derivative-date">{new Date(d.createdAt).toLocaleDateString()}</span>
                    </a>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Transcription Tab */}
          {tab === 'transcription' && (
            <Card>
              {source.transcription ? (
                <div className="transcription-viewer">
                  <div className="transcription-header">
                    <Badge variant={source.isTranscribed ? 'success' : 'warning'}>
                      {source.isTranscribed ? 'Transcribed' : 'Not Transcribed'}
                    </Badge>
                    {source.wordCount && <span className="word-count">{source.wordCount.toLocaleString()} words</span>}
                  </div>
                  <pre className="transcription-text">{source.transcription}</pre>
                </div>
              ) : (
                <p className="empty-text">
                  {source.mediaType === 'text'
                    ? 'No text body provided yet.'
                    : 'Transcription not yet available. Processing via ElevenLabs Scribe.'}
                </p>
              )}
            </Card>
          )}

          {/* Jobs Tab */}
          {tab === 'jobs' && (
            <Card>
              {source.processingJobs.length === 0 ? (
                <p className="empty-text">No processing jobs for this source.</p>
              ) : (
                <div className="jobs-list">
                  {source.processingJobs.map((job: any) => {
                    const jobBadge = JOB_STATUS_BADGES[job.status] || JOB_STATUS_BADGES.queued
                    return (
                      <div key={job.id} className="job-item">
                        <div className="job-info">
                          <span className="job-type">{job.jobType.replace(/_/g, ' ')}</span>
                          <div className="job-badges">
                            <Badge variant={jobBadge.variant} size="sm">{jobBadge.label}</Badge>
                            {job.progress > 0 && job.status === 'processing' && (
                              <Badge variant="orange" size="sm">{job.progress}%</Badge>
                            )}
                          </div>
                        </div>
                        <div className="job-meta">
                          {job.status === 'processing' && (
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                            </div>
                          )}
                          {job.errorMessage && (
                            <span className="job-error">{job.errorMessage}</span>
                          )}
                          <span className="job-date">{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Actions */}
          <Card title="Actions">
            <div className="actions">
              <button
                className="action-btn repurpose"
                onClick={handleRepurpose}
                disabled={repurposing || source.status !== 'ready'}
              >
                {repurposing ? 'Queuing...' : 'Repurpose All'}
              </button>
              {source.status !== 'ready' && (
                <p className="action-note">Source must be "ready" to repurpose</p>
              )}
            </div>
          </Card>

          {/* Source Info */}
          <Card title="Source Details">
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Content ID</span>
                <span className="info-value mono">{source.contentId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Content Type</span>
                <span className="info-value">{source.contentType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Media Type</span>
                <span className="info-value">{source.mediaType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Language</span>
                <span className="info-value">{source.language.toUpperCase()}</span>
              </div>
              {source.wordCount && (
                <div className="info-row">
                  <span className="info-label">Word Count</span>
                  <span className="info-value">{source.wordCount.toLocaleString()}</span>
                </div>
              )}
              {source.durationSeconds && (
                <div className="info-row">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{Math.round(source.durationSeconds / 60)} min</span>
                </div>
              )}
              {source.sourceUrl && (
                <div className="info-row">
                  <span className="info-label">Source URL</span>
                  <span className="info-value mono" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{source.sourceUrl}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(source.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Updated</span>
                <span className="info-value">{new Date(source.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card title="Counts">
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Derivatives</span>
                <span className="info-value bold">{source.derivatives.length}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Jobs</span>
                <span className="info-value bold">{source.processingJobs.length}</span>
              </div>
            </div>
          </Card>
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
          gap: 1rem;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0;
          border-bottom: 2px solid #e5e7eb;
        }
        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }
        .tab:hover { color: #111827; }
        .tab.active {
          color: #f97316;
          border-bottom-color: #f97316;
        }

        /* Derivatives */
        .derivatives-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .derivative-item {
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
        .derivative-item:hover { background: #f3f4f6; }
        .derivative-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .derivative-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .derivative-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .derivative-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Transcription */
        .transcription-viewer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .transcription-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .word-count {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .transcription-text {
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

        /* Jobs */
        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .job-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .job-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .job-type {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          text-transform: capitalize;
        }
        .job-badges {
          display: flex;
          gap: 0.5rem;
        }
        .job-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #f97316;
          border-radius: 3px;
          transition: width 0.3s;
        }
        .job-error {
          font-size: 0.75rem;
          color: #ef4444;
        }
        .job-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
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
          transition: opacity 0.2s;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn.repurpose {
          background: #f97316;
          color: white;
        }
        .action-note {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
          text-align: center;
        }
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
        .info-value.bold {
          font-weight: 700;
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
