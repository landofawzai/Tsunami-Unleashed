// Series Detail Page
// View series info, content items in series, edit series

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
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

const SERIES_STATUS_BADGES: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success', completed: 'neutral', paused: 'warning',
}

export default function SeriesDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editTotalPlanned, setEditTotalPlanned] = useState('0')

  const { data: series, error } = useSWR(`/api/series/${id}`, fetcher, { refreshInterval: 30000 })

  function startEdit() {
    if (!series) return
    setEditTitle(series.title)
    setEditDescription(series.description || '')
    setEditStatus(series.status)
    setEditTotalPlanned(String(series.totalPlanned))
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          totalPlanned: parseInt(editTotalPlanned) || 0,
        }),
      })
      if (res.ok) {
        setEditing(false)
        mutate(`/api/series/${id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="detail-page">
        <p className="error-text">Failed to load series</p>
        <style jsx>{`.detail-page { padding: 2rem; } .error-text { color: #991b1b; }`}</style>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="detail-page">
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        <style jsx>{`
          .detail-page { padding: 2rem; }
          .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; padding: 4rem; }
          .spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const items = series.items || []
  const itemCount = items.length
  const progress = series.totalPlanned > 0 ? Math.min((itemCount / series.totalPlanned) * 100, 100) : 0
  const finalized = items.filter((i: any) => ['finalized', 'sent_to_repurposing', 'archived'].includes(i.status)).length

  return (
    <div className="detail-page">
      <a href="/series" className="back-link">&#8592; Back to Series</a>

      {/* Header */}
      <div className="series-header">
        <div className="header-info">
          <h1 className="series-title">{series.title}</h1>
          <div className="header-badges">
            <Badge variant={SERIES_STATUS_BADGES[series.status] || 'neutral'}>{series.status}</Badge>
            {series.contentType && <Badge variant="info" size="sm">{series.contentType}</Badge>}
          </div>
        </div>
        <div className="header-actions">
          {!editing && <button className="btn-secondary" onClick={startEdit}>Edit Series</button>}
        </div>
      </div>

      {/* Edit Panel */}
      {editing && (
        <Card title="Edit Series">
          <div className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total Planned</label>
                <input type="number" value={editTotalPlanned} onChange={(e) => setEditTotalPlanned(e.target.value)} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {/* Series Stats */}
      <div className="stats-row">
        <Card>
          <div className="stat-block">
            <div className="stat-num">{itemCount}</div>
            <div className="stat-label">Content Items</div>
          </div>
        </Card>
        <Card>
          <div className="stat-block">
            <div className="stat-num">{series.totalPlanned}</div>
            <div className="stat-label">Total Planned</div>
          </div>
        </Card>
        <Card>
          <div className="stat-block">
            <div className="stat-num">{finalized}</div>
            <div className="stat-label">Finalized</div>
          </div>
        </Card>
      </div>

      {/* Progress */}
      {series.totalPlanned > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-wrapper">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {series.description && (
        <Card title="Description">
          <p className="desc-text">{series.description}</p>
        </Card>
      )}

      {/* Content Items */}
      <Card title={`Content Items (${itemCount})`}>
        {items.length === 0 ? (
          <p className="empty-text">No content items in this series yet.</p>
        ) : (
          <div className="items-list">
            {items.map((item: any) => (
              <a key={item.id} href={`/content/${item.id}`} className="item-row">
                <div className="item-info">
                  <span className="item-id">{item.contentId}</span>
                  <span className="item-title">{item.title}</span>
                </div>
                <div className="item-meta">
                  <Badge variant={STATUS_BADGES[item.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                  <span className="item-type">{item.contentType}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>

      <style jsx>{`
        .detail-page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .back-link { font-size: 0.85rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
        .series-header { display: flex; justify-content: space-between; align-items: flex-start; margin: 0.75rem 0 1.5rem 0; gap: 1rem; }
        .header-info { flex: 1; }
        .series-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0; }
        .header-badges { display: flex; gap: 0.5rem; }
        .header-actions { display: flex; gap: 0.5rem; }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857); color: white; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; }
        .btn-secondary {
          background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
          padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }

        .edit-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; color: #111827;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .form-actions { display: flex; gap: 0.5rem; }

        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-block { text-align: center; }
        .stat-num { font-size: 2rem; font-weight: 700; color: #10b981; }
        .stat-label { font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem; }

        .progress-section { margin-bottom: 1.5rem; }
        .progress-header { display: flex; justify-content: space-between; font-size: 0.85rem; color: #374151; font-weight: 600; margin-bottom: 0.375rem; }
        .progress-wrapper { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981, #047857); border-radius: 4px; transition: width 0.5s; }

        .desc-text { font-size: 0.875rem; color: #374151; margin: 0; line-height: 1.6; }

        .items-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .item-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem; background: #f9fafb; border-radius: 8px;
          text-decoration: none; transition: background 0.2s;
        }
        .item-row:hover { background: #f3f4f6; }
        .item-info { display: flex; flex-direction: column; gap: 0.125rem; }
        .item-id { font-size: 0.7rem; color: #9ca3af; font-family: monospace; }
        .item-title { font-size: 0.875rem; color: #111827; font-weight: 500; }
        .item-meta { display: flex; align-items: center; gap: 0.5rem; }
        .item-type { font-size: 0.75rem; color: #6b7280; }

        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }

        @media (max-width: 640px) {
          .detail-page { padding: 1rem; }
          .series-header { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: 1fr; }
          .item-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
      `}</style>
    </div>
  )
}
