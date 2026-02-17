'use client'

// Jobs Page — Processing queue with progress bars and status filters

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  queued: { variant: 'neutral', label: 'Queued' },
  processing: { variant: 'orange', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
}

const JOB_TYPE_LABELS: Record<string, string> = {
  transcription: 'Transcription',
  clip_extraction: 'Clip Extraction',
  derivative_generation: 'Derivative Generation',
  translation: 'Translation',
  image_generation: 'Image Generation',
  batch_repurpose: 'Batch Repurpose',
}

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)
  if (jobTypeFilter) params.set('jobType', jobTypeFilter)

  const { data, mutate } = useSWR(`/api/jobs?${params.toString()}`, fetcher, {
    refreshInterval: 10000,
  })

  async function handleRetry(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Job ${jobId} queued for retry`)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    }
  }

  async function handleCancel(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Job ${jobId} cancelled`)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    }
  }

  async function handleProcessNext() {
    try {
      const res = await fetch('/api/jobs/process-next', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(data.message)
      mutate()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Processing Queue</h1>
          <p className="page-subtitle">{data?.total || 0} jobs — 10s auto-refresh</p>
        </div>
        <button className="process-btn" onClick={handleProcessNext}>
          Process Next Job
        </button>
      </div>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.startsWith('Error') ? 'error' : 'success'}`}>
          {actionMessage}
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-input">
          <option value="">All Status</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)} className="filter-input">
          <option value="">All Types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Jobs List */}
      <div className="jobs-list">
        {!data ? (
          <Card><p className="empty-text">Loading jobs...</p></Card>
        ) : data.jobs.length === 0 ? (
          <Card><p className="empty-text">No jobs found.</p></Card>
        ) : (
          data.jobs.map((job: any) => {
            const statusBadge = STATUS_BADGES[job.status] || STATUS_BADGES.queued
            return (
              <Card key={job.id}>
                <div className="job-card">
                  <div className="job-header">
                    <div className="job-info">
                      <h3 className="job-type">{JOB_TYPE_LABELS[job.jobType] || job.jobType}</h3>
                      <div className="job-badges">
                        <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                        <Badge variant="neutral" size="sm">Priority: {job.priority}</Badge>
                        {job.retryCount > 0 && (
                          <Badge variant="warning" size="sm">Retry {job.retryCount}/{job.maxRetries}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="job-actions">
                      {job.status === 'failed' && (
                        <button className="action-btn retry" onClick={() => handleRetry(job.id)}>Retry</button>
                      )}
                      {job.status === 'queued' && (
                        <button className="action-btn cancel" onClick={() => handleCancel(job.id)}>Cancel</button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'processing' || job.progress > 0) && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${job.status === 'failed' ? 'failed' : ''}`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{job.progress}%</span>
                    </div>
                  )}

                  {/* Error */}
                  {job.errorMessage && (
                    <div className="job-error">{job.errorMessage}</div>
                  )}

                  {/* Meta */}
                  <div className="job-meta">
                    <span className="meta-item">ID: {job.id.slice(0, 8)}...</span>
                    {job.sourceContentId && <span className="meta-item">Source: {job.sourceContentId.slice(0, 8)}...</span>}
                    <span className="meta-item">Created: {new Date(job.createdAt).toLocaleString()}</span>
                    {job.startedAt && <span className="meta-item">Started: {new Date(job.startedAt).toLocaleString()}</span>}
                    {job.completedAt && <span className="meta-item">Completed: {new Date(job.completedAt).toLocaleString()}</span>}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <span>Page {data.page} of {data.totalPages} ({data.total} total)</span>
        </div>
      )}

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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
        .process-btn {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .process-btn:hover { background: #ea580c; }
        .action-msg {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .action-msg.success { background: #d1fae5; color: #065f46; }
        .action-msg.error { background: #fee2e2; color: #991b1b; }
        .filters {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .filter-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .job-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .job-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .job-type {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .job-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .job-actions {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .action-btn.retry { background: #fef3c7; color: #92400e; }
        .action-btn.cancel { background: #fee2e2; color: #991b1b; }
        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #f97316;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .progress-fill.failed { background: #ef4444; }
        .progress-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          min-width: 3rem;
          text-align: right;
        }
        .job-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .job-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        .pagination {
          text-align: center;
          padding: 1.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .filters { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
