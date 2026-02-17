// Content List Page
// Browse, filter, search, and create content items

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

export default function ContentPage() {
  const [search, setSearch] = useState('')
  const [contentType, setContentType] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('sermon')
  const [newMedia, setNewMedia] = useState('video')
  const [newDescription, setNewDescription] = useState('')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [newPriority, setNewPriority] = useState('5')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (contentType) params.set('contentType', contentType)
  if (mediaType) params.set('mediaType', mediaType)
  if (status) params.set('status', status)
  params.set('limit', '50')

  const { data, error } = useSWR(`/api/content?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  const { data: seriesData } = useSWR('/api/series', fetcher)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          contentType: newType,
          mediaType: newMedia,
          description: newDescription.trim() || undefined,
          assignedTo: newAssignedTo.trim() || undefined,
          priority: parseInt(newPriority),
        }),
      })
      if (res.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewAssignedTo('')
        setNewPriority('5')
        setShowCreate(false)
        mutate(`/api/content?${params.toString()}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content</h1>
          <p className="page-subtitle">{total} content items</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Content'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create New Content">
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Content title..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  placeholder="Name..."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Content Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="sermon">Sermon</option>
                  <option value="teaching">Teaching</option>
                  <option value="article">Article</option>
                  <option value="study_guide">Study Guide</option>
                  <option value="testimony">Testimony</option>
                </select>
              </div>
              <div className="form-group">
                <label>Media Type</label>
                <select value={newMedia} onChange={(e) => setNewMedia(e.target.value)}>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="text">Text</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority (1-10)</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}{n === 1 ? ' (Highest)' : n === 5 ? ' (Normal)' : n === 10 ? ' (Lowest)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating...' : 'Create Content'}
            </button>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by title or content ID..."
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
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Content List */}
      {error ? (
        <Card><p className="error-text">Failed to load content</p></Card>
      ) : !data ? (
        <Card>
          <div className="loading">
            <div className="spinner" />
            <span>Loading content...</span>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <p className="empty-text">No content items found. Create your first content item above.</p>
        </Card>
      ) : (
        <div className="content-list">
          {items.map((item: any) => (
            <a key={item.id} href={`/content/${item.id}`} className="content-card">
              <div className="content-card-header">
                <span className="content-id">{item.contentId}</span>
                <Badge variant={STATUS_BADGES[item.status] || 'neutral'} size="sm">
                  {STATUS_LABELS[item.status] || item.status}
                </Badge>
              </div>
              <h3 className="content-title">{item.title}</h3>
              {item.description && (
                <p className="content-desc">{item.description}</p>
              )}
              <div className="content-meta">
                <span className="meta-tag type-tag">{TYPE_LABELS[item.contentType] || item.contentType}</span>
                <span className="meta-tag media-tag">{MEDIA_LABELS[item.mediaType] || item.mediaType}</span>
                {item.assignedTo && <span className="meta-tag assign-tag">{item.assignedTo}</span>}
                {item.series && <span className="meta-tag series-tag">{item.series.title}</span>}
                {item.priority <= 3 && <span className="meta-tag priority-tag">P{item.priority}</span>}
              </div>
              <div className="content-footer">
                <span className="content-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                {item.sentToRepurposing && <Badge variant="teal" size="sm">Sent</Badge>}
              </div>
            </a>
          ))}
        </div>
      )}

      <style jsx>{`
        .content-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
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
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Create Form */
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #111827;
          background: white;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .form-group textarea {
          resize: vertical;
        }

        /* Filters */
        .filters {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111827;
        }
        .search-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .filters select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          cursor: pointer;
        }

        /* Content List */
        .content-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }
        .content-card {
          display: block;
          text-decoration: none;
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          border-left: 4px solid #10b981;
        }
        .content-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .content-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .content-id {
          font-size: 0.7rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .content-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.375rem 0;
          line-height: 1.3;
        }
        .content-desc {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0 0 0.75rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .content-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-bottom: 0.75rem;
        }
        .meta-tag {
          font-size: 0.7rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }
        .type-tag {
          background: #dbeafe;
          color: #1e40af;
        }
        .media-tag {
          background: #f3e8ff;
          color: #7c3aed;
        }
        .assign-tag {
          background: #fef3c7;
          color: #92400e;
        }
        .series-tag {
          background: #d1fae5;
          color: #065f46;
        }
        .priority-tag {
          background: #fee2e2;
          color: #991b1b;
        }
        .content-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .content-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* States */
        .error-text {
          color: #991b1b;
          text-align: center;
          margin: 0;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          margin: 0;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #6b7280;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .content-page { padding: 1rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .filters { flex-direction: column; }
          .content-list { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
