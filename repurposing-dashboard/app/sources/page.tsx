'use client'

// Sources Page — Source content list with filters and add form
// Manages original content (sermons, teachings, articles)

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  pending: { variant: 'neutral', label: 'Pending' },
  processing: { variant: 'orange', label: 'Processing' },
  ready: { variant: 'success', label: 'Ready' },
  failed: { variant: 'error', label: 'Failed' },
}

const MEDIA_BADGES: Record<string, { variant: 'info' | 'purple' | 'orange' | 'neutral'; label: string }> = {
  video: { variant: 'purple', label: 'Video' },
  audio: { variant: 'info', label: 'Audio' },
  text: { variant: 'neutral', label: 'Text' },
  mixed: { variant: 'orange', label: 'Mixed' },
}

export default function SourcesPage() {
  const [search, setSearch] = useState('')
  const [contentType, setContentType] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [status, setStatus] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    contentType: 'sermon',
    mediaType: 'text',
    language: 'en',
    sourceUrl: '',
    body: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (contentType) params.set('contentType', contentType)
  if (mediaType) params.set('mediaType', mediaType)
  if (status) params.set('status', status)

  const { data, mutate } = useSWR(`/api/sources?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create source')
      }
      setFormData({ title: '', contentType: 'sermon', mediaType: 'text', language: 'en', sourceUrl: '', body: '' })
      setShowAddForm(false)
      mutate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Source Content</h1>
          <p className="page-subtitle">{data?.total || 0} sources — sermons, teachings, articles</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Source'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card title="Add New Source" subtitle="Manually add source content">
          <form onSubmit={handleSubmit} className="add-form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter source title"
                />
              </div>
              <div className="form-group">
                <label>Content Type</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                >
                  <option value="sermon">Sermon</option>
                  <option value="teaching">Teaching</option>
                  <option value="article">Article</option>
                  <option value="study_guide">Study Guide</option>
                  <option value="testimony">Testimony</option>
                </select>
              </div>
              <div className="form-group">
                <label>Media Type</label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                  <option value="mai">Maithili</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Source URL (optional)</label>
                <input
                  type="text"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {formData.mediaType === 'text' && (
                <div className="form-group full-width">
                  <label>Body Text</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Paste the source text content..."
                    rows={6}
                  />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Creating...' : 'Create Source'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search sources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input search-input"
        />
        <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="filter-input">
          <option value="">All Types</option>
          <option value="sermon">Sermon</option>
          <option value="teaching">Teaching</option>
          <option value="article">Article</option>
          <option value="study_guide">Study Guide</option>
          <option value="testimony">Testimony</option>
        </select>
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="filter-input">
          <option value="">All Media</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="text">Text</option>
          <option value="mixed">Mixed</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-input">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Sources List */}
      <div className="sources-grid">
        {!data ? (
          <Card><p className="empty-text">Loading sources...</p></Card>
        ) : data.sources.length === 0 ? (
          <Card><p className="empty-text">No sources found. Add your first source above.</p></Card>
        ) : (
          data.sources.map((source: any) => {
            const statusBadge = STATUS_BADGES[source.status] || STATUS_BADGES.pending
            const mediaBadge = MEDIA_BADGES[source.mediaType] || MEDIA_BADGES.text
            return (
              <a key={source.id} href={`/sources/${source.id}`} className="source-link">
                <Card>
                  <div className="source-card">
                    <div className="source-top">
                      <h3 className="source-title">{source.title}</h3>
                      <div className="source-badges">
                        <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                        <Badge variant={mediaBadge.variant} size="sm">{mediaBadge.label}</Badge>
                        <Badge variant="neutral" size="sm">{source.contentType}</Badge>
                      </div>
                    </div>
                    <div className="source-meta">
                      <span className="meta-item">{source._count.derivatives} derivatives</span>
                      <span className="meta-item">{source._count.processingJobs} jobs</span>
                      {source.wordCount && <span className="meta-item">{source.wordCount.toLocaleString()} words</span>}
                      {source.durationSeconds && <span className="meta-item">{Math.round(source.durationSeconds / 60)}m</span>}
                    </div>
                    <div className="source-footer">
                      <span className="source-id">{source.contentId}</span>
                      <span className="source-date">{new Date(source.createdAt).toLocaleDateString()}</span>
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
        .add-btn {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s;
        }
        .add-btn:hover {
          background: #ea580c;
        }

        /* Add Form */
        .add-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .form-group textarea {
          resize: vertical;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
        }
        .submit-btn {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Filters */
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

        /* Grid */
        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1rem;
        }
        .source-link {
          text-decoration: none;
          color: inherit;
        }
        .source-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .source-top {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .source-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .source-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .source-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }
        .source-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .source-id {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .source-date {
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
          .form-grid { grid-template-columns: 1fr; }
          .sources-grid { grid-template-columns: 1fr; }
          .filters { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
