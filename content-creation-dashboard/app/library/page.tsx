// Library Page
// Archive view — search finalized/sent/archived content with downstream status

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', drafting: 'Drafting', recording: 'Recording',
  editing: 'Editing', review: 'Review', approved: 'Approved',
  finalized: 'Finalized', sent_to_repurposing: 'Sent', archived: 'Archived',
}

const STATUS_BADGES: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'emerald' | 'teal'> = {
  planning: 'neutral', drafting: 'info', recording: 'info',
  editing: 'warning', review: 'warning', approved: 'success',
  finalized: 'emerald', sent_to_repurposing: 'teal', archived: 'neutral',
}

const TYPE_LABELS: Record<string, string> = {
  sermon: 'Sermon', teaching: 'Teaching', article: 'Article',
  study_guide: 'Study Guide', testimony: 'Testimony',
}

const MEDIA_LABELS: Record<string, string> = {
  video: 'Video', audio: 'Audio', text: 'Text', mixed: 'Mixed',
}

export default function LibraryPage() {
  const [search, setSearch] = useState('')
  const [contentType, setContentType] = useState('')
  const [mediaType, setMediaType] = useState('')

  // Library shows finalized, sent, and archived content
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (contentType) params.set('contentType', contentType)
  if (mediaType) params.set('mediaType', mediaType)
  params.set('limit', '100')

  const { data, error } = useSWR(`/api/content?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  const allItems = data?.items || []
  // Filter to library-worthy statuses (approved, finalized, sent, archived)
  const libraryStatuses = ['approved', 'finalized', 'sent_to_repurposing', 'archived']
  const items = allItems.filter((item: any) => libraryStatuses.includes(item.status))

  // Stats
  const totalFinalized = items.filter((i: any) => i.status === 'finalized').length
  const totalSent = items.filter((i: any) => i.status === 'sent_to_repurposing').length
  const totalArchived = items.filter((i: any) => i.status === 'archived').length

  return (
    <div className="library-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Library</h1>
          <p className="page-subtitle">Finalized content archive & downstream tracking</p>
        </div>
      </div>

      {/* Library Stats */}
      <div className="library-stats">
        <div className="lib-stat">
          <span className="lib-stat-num">{items.length}</span>
          <span className="lib-stat-label">Total in Library</span>
        </div>
        <div className="lib-stat">
          <span className="lib-stat-num">{totalFinalized}</span>
          <span className="lib-stat-label">Finalized</span>
        </div>
        <div className="lib-stat">
          <span className="lib-stat-num">{totalSent}</span>
          <span className="lib-stat-label">Sent to Repurposing</span>
        </div>
        <div className="lib-stat">
          <span className="lib-stat-num">{totalArchived}</span>
          <span className="lib-stat-label">Archived</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search library by title or content ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
          <option value="">All Types</option>
          <option value="sermon">Sermon</option>
          <option value="teaching">Teaching</option>
          <option value="article">Article</option>
          <option value="study_guide">Study Guide</option>
          <option value="testimony">Testimony</option>
        </select>
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
          <option value="">All Media</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="text">Text</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Library Items */}
      {error ? (
        <Card><p className="error-text">Failed to load library</p></Card>
      ) : !data ? (
        <Card>
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <p className="empty-text">No finalized content in the library yet. Content appears here once approved or finalized.</p>
        </Card>
      ) : (
        <div className="library-list">
          {items.map((item: any) => (
            <a key={item.id} href={`/content/${item.id}`} className="library-card">
              <div className="card-top">
                <div className="card-info">
                  <span className="card-id">{item.contentId}</span>
                  <h3 className="card-title">{item.title}</h3>
                </div>
                <div className="card-badges">
                  <Badge variant={STATUS_BADGES[item.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                  {item.sentToRepurposing && (
                    <Badge variant="teal" size="sm">Downstream Active</Badge>
                  )}
                </div>
              </div>
              {item.description && <p className="card-desc">{item.description}</p>}
              <div className="card-meta">
                <span className="meta-item">{TYPE_LABELS[item.contentType] || item.contentType}</span>
                <span className="meta-item">{MEDIA_LABELS[item.mediaType] || item.mediaType}</span>
                <span className="meta-item">{item.language}</span>
                {item.wordCount && <span className="meta-item">{item.wordCount.toLocaleString()} words</span>}
                {item.durationSeconds && <span className="meta-item">{Math.floor(item.durationSeconds / 60)}m</span>}
                {item.sentAt && <span className="meta-item">Sent {new Date(item.sentAt).toLocaleDateString()}</span>}
              </div>
              {item.series && (
                <div className="card-series">Series: {item.series.title}</div>
              )}
            </a>
          ))}
        </div>
      )}

      <style jsx>{`
        .library-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }

        .library-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .lib-stat {
          background: white; border-radius: 10px; padding: 1rem;
          text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-top: 3px solid #10b981;
        }
        .lib-stat-num { display: block; font-size: 1.75rem; font-weight: 700; color: #111827; }
        .lib-stat-label { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }

        .filters { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .search-input {
          flex: 1; min-width: 250px; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db;
          border-radius: 8px; font-size: 0.875rem; color: #111827;
        }
        .search-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .filters select {
          padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: white;
        }

        .library-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .library-card {
          display: block; text-decoration: none; background: white;
          border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s; border-left: 4px solid #047857;
        }
        .library-card:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.375rem; }
        .card-info { flex: 1; min-width: 0; }
        .card-id { font-size: 0.7rem; color: #9ca3af; font-family: monospace; }
        .card-title { margin: 0.125rem 0 0 0; font-size: 1rem; font-weight: 600; color: #111827; }
        .card-badges { display: flex; gap: 0.375rem; flex-shrink: 0; flex-wrap: wrap; }
        .card-desc {
          font-size: 0.8rem; color: #6b7280; margin: 0 0 0.5rem 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .meta-item { font-size: 0.75rem; color: #6b7280; }
        .card-series { font-size: 0.75rem; color: #10b981; margin-top: 0.375rem; font-weight: 500; }

        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .library-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .library-page { padding: 1rem; }
          .library-stats { grid-template-columns: 1fr; }
          .filters { flex-direction: column; }
          .card-top { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
