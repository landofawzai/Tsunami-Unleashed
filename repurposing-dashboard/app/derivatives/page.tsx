'use client'

// Derivatives Page — Browse all generated derivatives with filters

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

const TYPE_COLORS: Record<string, 'info' | 'success' | 'purple' | 'warning' | 'orange' | 'error' | 'neutral'> = {
  blog_post: 'info',
  social_quote: 'success',
  thread_summary: 'purple',
  study_guide: 'warning',
  newsletter_excerpt: 'orange',
  audio_transcription: 'neutral',
  video_clip_meta: 'neutral',
  quote_graphic: 'purple',
}

export default function DerivativesPage() {
  const [search, setSearch] = useState('')
  const [derivativeType, setDerivativeType] = useState('')
  const [status, setStatus] = useState('')
  const [sentFilter, setSentFilter] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (derivativeType) params.set('derivativeType', derivativeType)
  if (status) params.set('status', status)
  if (sentFilter) params.set('sentToDistribution', sentFilter)

  const { data } = useSWR(`/api/derivatives?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Derivatives</h1>
          <p className="page-subtitle">{data?.total || 0} derivatives across 8 types</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search derivatives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input search-input"
        />
        <select value={derivativeType} onChange={(e) => setDerivativeType(e.target.value)} className="filter-input">
          <option value="">All Types</option>
          {Object.entries(DERIVATIVE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-input">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="sent_to_distribution">Sent to Distribution</option>
          <option value="failed">Failed</option>
        </select>
        <select value={sentFilter} onChange={(e) => setSentFilter(e.target.value)} className="filter-input">
          <option value="">All Distribution</option>
          <option value="true">Sent</option>
          <option value="false">Not Sent</option>
        </select>
      </div>

      {/* Derivatives Grid */}
      <div className="derivatives-grid">
        {!data ? (
          <Card><p className="empty-text">Loading derivatives...</p></Card>
        ) : data.derivatives.length === 0 ? (
          <Card><p className="empty-text">No derivatives found. Generate from a source.</p></Card>
        ) : (
          data.derivatives.map((d: any) => {
            const typeColor = TYPE_COLORS[d.derivativeType] || 'neutral'
            return (
              <a key={d.id} href={`/derivatives/${d.id}`} className="derivative-link">
                <Card>
                  <div className="derivative-card">
                    <div className="derivative-top">
                      <h3 className="derivative-title">{d.title}</h3>
                      <div className="derivative-badges">
                        <Badge variant={typeColor} size="sm">
                          {DERIVATIVE_LABELS[d.derivativeType] || d.derivativeType}
                        </Badge>
                        <Badge
                          variant={d.sentToDistribution ? 'success' : d.status === 'failed' ? 'error' : 'neutral'}
                          size="sm"
                        >
                          {d.sentToDistribution ? 'Distributed' : d.status}
                        </Badge>
                        {d._count.translations > 0 && (
                          <Badge variant="purple" size="sm">{d._count.translations} translations</Badge>
                        )}
                      </div>
                    </div>
                    <p className="derivative-preview">
                      {d.body.slice(0, 150)}{d.body.length > 150 ? '...' : ''}
                    </p>
                    <div className="derivative-footer">
                      <span className="derivative-source">
                        From: {d.sourceContent?.title || d.parentContentId}
                      </span>
                      <span className="derivative-date">{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              </a>
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
        .filters {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .filter-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
        }
        .derivatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1rem;
        }
        .derivative-link {
          text-decoration: none;
          color: inherit;
        }
        .derivative-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .derivative-top {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .derivative-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .derivative-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .derivative-preview {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .derivative-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .derivative-source {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .derivative-date {
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
          .derivatives-grid { grid-template-columns: 1fr; }
          .filters { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
