// Series List Page
// Browse and create content series with progress tracking

'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success', completed: 'neutral', paused: 'warning',
}

export default function SeriesPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newContentType, setNewContentType] = useState('')
  const [newTotalPlanned, setNewTotalPlanned] = useState('0')

  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)
  const apiUrl = `/api/series?${params.toString()}`

  const { data, error } = useSWR(apiUrl, fetcher, { refreshInterval: 30000 })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          contentType: newContentType || undefined,
          totalPlanned: parseInt(newTotalPlanned) || 0,
        }),
      })
      if (res.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewContentType('')
        setNewTotalPlanned('0')
        setShowCreate(false)
        mutate(apiUrl)
      }
    } finally {
      setCreating(false)
    }
  }

  const series = data?.series || []

  return (
    <div className="series-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Series</h1>
          <p className="page-subtitle">{series.length} series</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Series'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create New Series">
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Series title..." required />
              </div>
              <div className="form-group">
                <label>Total Planned</label>
                <input type="number" value={newTotalPlanned} onChange={(e) => setNewTotalPlanned(e.target.value)} min="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Content Type (optional)</label>
                <select value={newContentType} onChange={(e) => setNewContentType(e.target.value)}>
                  <option value="">Any type</option>
                  <option value="sermon">Sermon</option>
                  <option value="teaching">Teaching</option>
                  <option value="article">Article</option>
                  <option value="study_guide">Study Guide</option>
                  <option value="testimony">Testimony</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="Series description..." />
            </div>
            <button type="submit" className="btn-primary" disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating...' : 'Create Series'}
            </button>
          </form>
        </Card>
      )}

      {/* Filter */}
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {/* Series List */}
      {error ? (
        <Card><p className="error-text">Failed to load series</p></Card>
      ) : !data ? (
        <Card>
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </Card>
      ) : series.length === 0 ? (
        <Card><p className="empty-text">No series found. Create your first series above.</p></Card>
      ) : (
        <div className="series-list">
          {series.map((s: any) => {
            const itemCount = s._count?.items || 0
            const progress = s.totalPlanned > 0 ? Math.min((itemCount / s.totalPlanned) * 100, 100) : 0
            return (
              <a key={s.id} href={`/series/${s.id}`} className="series-card">
                <div className="series-header">
                  <h3 className="series-title">{s.title}</h3>
                  <Badge variant={STATUS_BADGES[s.status] || 'neutral'} size="sm">
                    {s.status}
                  </Badge>
                </div>
                {s.description && <p className="series-desc">{s.description}</p>}
                <div className="series-stats">
                  <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                  {s.totalPlanned > 0 && <span>{itemCount}/{s.totalPlanned} planned</span>}
                  {s.contentType && <span className="series-type">{s.contentType}</span>}
                </div>
                {s.totalPlanned > 0 && (
                  <div className="progress-wrapper">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </a>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .series-page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857); color: white; border: none;
          padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .create-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; color: #111827;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }

        .filters { margin-bottom: 1.5rem; }
        .filters select {
          padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: white;
        }

        .series-list { display: flex; flex-direction: column; gap: 1rem; }
        .series-card {
          display: block; text-decoration: none; background: white;
          border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid #10b981; transition: transform 0.2s, box-shadow 0.2s;
        }
        .series-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .series-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
        .series-title { margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827; }
        .series-desc { font-size: 0.85rem; color: #6b7280; margin: 0 0 0.5rem 0; }
        .series-stats { display: flex; gap: 1rem; font-size: 0.8rem; color: #6b7280; margin-bottom: 0.5rem; }
        .series-type { text-transform: capitalize; }
        .progress-wrapper { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981, #047857); border-radius: 3px; transition: width 0.5s; }

        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .series-page { padding: 1rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
