// Content Detail Page
// View and edit content item with tabs: overview, brief, files, tasks, reviews

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

const NEXT_STATUS: Record<string, string> = {
  planning: 'drafting', drafting: 'recording', recording: 'editing',
  editing: 'review', approved: 'finalized',
}

type Tab = 'overview' | 'brief' | 'files' | 'tasks' | 'reviews'

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const { data: content, error } = useSWR(`/api/content/${id}`, fetcher, {
    refreshInterval: 30000,
  })

  // Editing state
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editPriority, setEditPriority] = useState('5')
  const [editLanguage, setEditLanguage] = useState('en')

  function startEdit() {
    if (!content) return
    setEditTitle(content.title)
    setEditDescription(content.description || '')
    setEditAssignedTo(content.assignedTo || '')
    setEditPriority(String(content.priority))
    setEditLanguage(content.language)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          assignedTo: editAssignedTo || null,
          priority: parseInt(editPriority),
          language: editLanguage,
        }),
      })
      if (res.ok) {
        setEditing(false)
        mutate(`/api/content/${id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function advanceStatus() {
    if (!content) return
    const next = NEXT_STATUS[content.status]
    if (!next) return
    setActionLoading('advance')
    try {
      await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      mutate(`/api/content/${id}`)
    } finally {
      setActionLoading('')
    }
  }

  async function submitForReview() {
    setActionLoading('review')
    try {
      await fetch(`/api/content/${id}/submit-for-review`, { method: 'POST' })
      mutate(`/api/content/${id}`)
    } finally {
      setActionLoading('')
    }
  }

  async function sendToRepurposing() {
    setActionLoading('send')
    try {
      await fetch(`/api/content/${id}/send-to-repurposing`, { method: 'POST' })
      mutate(`/api/content/${id}`)
    } finally {
      setActionLoading('')
    }
  }

  if (error) {
    return (
      <div className="detail-page">
        <p className="error-text">Failed to load content item</p>
        <style jsx>{`.detail-page { padding: 2rem; } .error-text { color: #991b1b; }`}</style>
      </div>
    )
  }

  if (!content) {
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

  const tasks = content.tasks || []
  const reviews = content.reviews || []
  const files = content.files || []
  const briefs = content.briefs || []
  const brief = briefs[0]

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'brief', label: 'Brief', count: briefs.length },
    { key: 'files', label: 'Files', count: files.length },
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'reviews', label: 'Reviews', count: reviews.length },
  ]

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <a href="/content" className="back-link">&#8592; Back to Content</a>
        <div className="header-row">
          <div className="header-info">
            <span className="content-id">{content.contentId}</span>
            <h1 className="detail-title">{content.title}</h1>
            <div className="header-badges">
              <Badge variant={STATUS_BADGES[content.status] || 'neutral'}>
                {STATUS_LABELS[content.status] || content.status}
              </Badge>
              <Badge variant="info" size="sm">{content.contentType}</Badge>
              <Badge variant="neutral" size="sm">{content.mediaType}</Badge>
              {content.priority <= 3 && <Badge variant="error" size="sm">P{content.priority}</Badge>}
            </div>
          </div>
          <div className="header-actions">
            {!editing && <button className="btn-secondary" onClick={startEdit}>Edit</button>}
            {NEXT_STATUS[content.status] && (
              <button className="btn-primary" onClick={advanceStatus} disabled={!!actionLoading}>
                {actionLoading === 'advance' ? '...' : `Advance to ${STATUS_LABELS[NEXT_STATUS[content.status]]}`}
              </button>
            )}
            {['drafting', 'recording', 'editing'].includes(content.status) && (
              <button className="btn-warning" onClick={submitForReview} disabled={!!actionLoading}>
                {actionLoading === 'review' ? '...' : 'Submit for Review'}
              </button>
            )}
            {['approved', 'finalized'].includes(content.status) && !content.sentToRepurposing && (
              <button className="btn-teal" onClick={sendToRepurposing} disabled={!!actionLoading}>
                {actionLoading === 'send' ? '...' : 'Send to Repurposing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      {editing && (
        <Card title="Edit Content">
          <div className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <input value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} />
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

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab content={content} />}
        {activeTab === 'brief' && <BriefTab brief={brief} contentItemId={id} />}
        {activeTab === 'files' && <FilesTab files={files} contentItemId={id} />}
        {activeTab === 'tasks' && <TasksTab tasks={tasks} contentItemId={id} />}
        {activeTab === 'reviews' && <ReviewsTab reviews={reviews} contentItemId={id} />}
      </div>

      <style jsx>{`
        .detail-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .back-link { font-size: 0.85rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
        .detail-header { margin-bottom: 1.5rem; }
        .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 0.75rem; gap: 1rem; flex-wrap: wrap; }
        .content-id { font-size: 0.75rem; color: #9ca3af; font-family: monospace; }
        .detail-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0.25rem 0 0.5rem 0; }
        .header-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .header-info { flex: 1; min-width: 0; }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857);
          color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px;
          font-weight: 600; font-size: 0.8rem; cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary {
          background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
          padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;
          font-size: 0.8rem; cursor: pointer;
        }
        .btn-warning {
          background: #f59e0b; color: white; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;
          font-size: 0.8rem; cursor: pointer;
        }
        .btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-teal {
          background: #14b8a6; color: white; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;
          font-size: 0.8rem; cursor: pointer;
        }
        .btn-teal:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Edit Form */
        .edit-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 0.875rem; color: #111827;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .form-actions { display: flex; gap: 0.5rem; }

        /* Tabs */
        .tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; }
        .tab {
          padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500;
          color: #6b7280; background: none; border: none; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
          display: flex; align-items: center; gap: 0.375rem;
        }
        .tab:hover { color: #111827; }
        .tab.active { color: #10b981; border-bottom-color: #10b981; font-weight: 600; }
        .tab-count {
          font-size: 0.7rem; background: #f3f4f6; color: #6b7280;
          padding: 0.1rem 0.4rem; border-radius: 4px;
        }
        .tab.active .tab-count { background: #d1fae5; color: #065f46; }

        .error-text { color: #991b1b; text-align: center; }

        @media (max-width: 640px) {
          .detail-page { padding: 1rem; }
          .header-row { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; }
          .tabs { overflow-x: auto; }
        }
      `}</style>
    </div>
  )
}

/* ========== Overview Tab ========== */
function OverviewTab({ content }: { content: any }) {
  return (
    <div className="overview-grid">
      <Card title="Details">
        <div className="detail-rows">
          <DetailRow label="Content Type" value={content.contentType} />
          <DetailRow label="Media Type" value={content.mediaType} />
          <DetailRow label="Language" value={content.language} />
          <DetailRow label="Priority" value={`${content.priority}/10`} />
          <DetailRow label="Assigned To" value={content.assignedTo || '—'} />
          {content.series && <DetailRow label="Series" value={content.series.title} />}
          {content.wordCount && <DetailRow label="Word Count" value={content.wordCount.toLocaleString()} />}
          {content.durationSeconds && <DetailRow label="Duration" value={`${Math.floor(content.durationSeconds / 60)}m`} />}
          {content.sourceUrl && <DetailRow label="Source URL" value={content.sourceUrl} />}
          {content.driveFileId && <DetailRow label="Drive File" value={content.driveFileId} />}
          <DetailRow label="Created" value={new Date(content.createdAt).toLocaleString()} />
          <DetailRow label="Updated" value={new Date(content.updatedAt).toLocaleString()} />
          {content.sentAt && <DetailRow label="Sent At" value={new Date(content.sentAt).toLocaleString()} />}
        </div>
      </Card>

      {content.description && (
        <Card title="Description">
          <p className="desc-text">{content.description}</p>
        </Card>
      )}

      {content.body && (
        <Card title="Body / Transcription">
          <p className="body-text">{content.body}</p>
        </Card>
      )}

      {content.metadata && (
        <Card title="Metadata Sidecar">
          <pre className="metadata-pre">{JSON.stringify(JSON.parse(content.metadata), null, 2)}</pre>
        </Card>
      )}

      <style jsx>{`
        .overview-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .detail-rows { display: flex; flex-direction: column; gap: 0.5rem; }
        .desc-text { font-size: 0.875rem; color: #374151; margin: 0; line-height: 1.6; }
        .body-text { font-size: 0.85rem; color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.5; max-height: 300px; overflow-y: auto; }
        .metadata-pre { font-size: 0.75rem; background: #f9fafb; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0; color: #374151; }
      `}</style>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
      <style jsx>{`
        .detail-row { display: flex; justify-content: space-between; padding: 0.375rem 0; border-bottom: 1px solid #f3f4f6; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 0.8rem; color: #6b7280; }
        .detail-value { font-size: 0.8rem; color: #111827; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
      `}</style>
    </div>
  )
}

/* ========== Brief Tab ========== */
function BriefTab({ brief, contentItemId }: { brief: any; contentItemId: string }) {
  const [creating, setCreating] = useState(false)
  const [outline, setOutline] = useState(brief?.outline || '')
  const [targetAudience, setTargetAudience] = useState(brief?.targetAudience || '')
  const [notes, setNotes] = useState(brief?.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId,
          outline: outline || null,
          targetAudience: targetAudience || null,
          notes: notes || null,
        }),
      })
      mutate(`/api/content/${contentItemId}`)
      setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  if (!brief && !creating) {
    return (
      <Card>
        <div className="empty-state">
          <p>No brief yet.</p>
          <button className="btn-primary" onClick={() => setCreating(true)}>Create Brief</button>
        </div>
        <style jsx>{`
          .empty-state { text-align: center; padding: 2rem; color: #9ca3af; }
          .btn-primary { background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
        `}</style>
      </Card>
    )
  }

  if (creating || brief) {
    return (
      <Card title={brief ? 'Content Brief' : 'Create Brief'}>
        <div className="brief-form">
          <div className="form-group">
            <label>Outline</label>
            <textarea value={outline} onChange={(e) => setOutline(e.target.value)} rows={6} placeholder="Content outline..." />
          </div>
          <div className="form-group">
            <label>Target Audience</label>
            <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Who is this for?" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Brief'}</button>
        </div>
        <style jsx>{`
          .brief-form { display: flex; flex-direction: column; gap: 1rem; }
          .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
          .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
          .form-group input, .form-group textarea { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
          .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #10b981; }
          .btn-primary { background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; align-self: flex-start; }
          .btn-primary:disabled { opacity: 0.5; }
        `}</style>
      </Card>
    )
  }

  return null
}

/* ========== Files Tab ========== */
function FilesTab({ files, contentItemId }: { files: any[]; contentItemId: string }) {
  const [adding, setAdding] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('document')
  const [driveFileId, setDriveFileId] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!fileName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId,
          fileName: fileName.trim(),
          fileType,
          driveFileId: driveFileId.trim() || undefined,
          driveUrl: driveUrl.trim() || undefined,
        }),
      })
      setFileName('')
      setDriveFileId('')
      setDriveUrl('')
      setAdding(false)
      mutate(`/api/content/${contentItemId}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(fileId: string) {
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
    mutate(`/api/content/${contentItemId}`)
  }

  return (
    <div className="files-section">
      <div className="section-header">
        <h3>{files.length} File{files.length !== 1 ? 's' : ''}</h3>
        <button className="btn-small" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : '+ Add File'}</button>
      </div>

      {adding && (
        <Card>
          <form onSubmit={handleAdd} className="add-form">
            <div className="form-row">
              <div className="form-group">
                <label>File Name *</label>
                <input value={fileName} onChange={(e) => setFileName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>File Type</label>
                <select value={fileType} onChange={(e) => setFileType(e.target.value)}>
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="image">Image</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Drive File ID</label>
                <input value={driveFileId} onChange={(e) => setDriveFileId(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Drive URL</label>
                <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add File'}</button>
          </form>
        </Card>
      )}

      {files.length === 0 ? (
        <Card><p className="empty-text">No files attached yet.</p></Card>
      ) : (
        <div className="files-list">
          {files.map((file: any) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <span className="file-name">{file.fileName}</span>
                <span className="file-meta">
                  {file.fileType}
                  {file.fileSize && ` | ${(file.fileSize / 1024).toFixed(0)} KB`}
                  {file.isPrimary && ' | Primary'}
                </span>
              </div>
              <div className="file-actions">
                {file.driveUrl && <a href={file.driveUrl} target="_blank" rel="noopener" className="file-link">Open</a>}
                <button className="btn-danger-small" onClick={() => handleDelete(file.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .files-section { display: flex; flex-direction: column; gap: 1rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; }
        .section-header h3 { margin: 0; font-size: 1rem; color: #111827; }
        .btn-small { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
        .add-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select { padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; }
        .btn-primary { background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; align-self: flex-start; }
        .btn-primary:disabled { opacity: 0.5; }
        .files-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .file-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .file-info { display: flex; flex-direction: column; gap: 0.125rem; }
        .file-name { font-size: 0.875rem; font-weight: 500; color: #111827; }
        .file-meta { font-size: 0.75rem; color: #6b7280; }
        .file-actions { display: flex; gap: 0.5rem; align-items: center; }
        .file-link { font-size: 0.8rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .btn-danger-small { background: none; color: #ef4444; border: 1px solid #fecaca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
      `}</style>
    </div>
  )
}

/* ========== Tasks Tab ========== */
function TasksTab({ tasks, contentItemId }: { tasks: any[]; contentItemId: string }) {
  const [adding, setAdding] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssigned, setTaskAssigned] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setSaving(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId,
          title: taskTitle.trim(),
          assignedTo: taskAssigned.trim() || undefined,
        }),
      })
      setTaskTitle('')
      setTaskAssigned('')
      setAdding(false)
      mutate(`/api/content/${contentItemId}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    mutate(`/api/content/${contentItemId}`)
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    mutate(`/api/content/${contentItemId}`)
  }

  const completed = tasks.filter((t: any) => t.status === 'completed').length

  return (
    <div className="tasks-section">
      <div className="section-header">
        <h3>{completed}/{tasks.length} Tasks Complete</h3>
        <button className="btn-small" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {tasks.length > 0 && (
        <div className="progress-bar-wrapper">
          <div className="progress-bar" style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }} />
        </div>
      )}

      {adding && (
        <Card>
          <form onSubmit={handleAdd} className="add-form">
            <div className="form-row">
              <div className="form-group">
                <label>Task Title *</label>
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required placeholder="What needs to be done?" />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input value={taskAssigned} onChange={(e) => setTaskAssigned(e.target.value)} placeholder="Name..." />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Task'}</button>
          </form>
        </Card>
      )}

      <div className="tasks-list">
        {tasks.map((task: any) => (
          <div key={task.id} className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}>
            <button className="task-check" onClick={() => toggleTask(task.id, task.status)}>
              {task.status === 'completed' ? '✓' : '○'}
            </button>
            <div className="task-info">
              <span className="task-title">{task.title}</span>
              {task.assignedTo && <span className="task-assigned">{task.assignedTo}</span>}
            </div>
            <button className="btn-danger-small" onClick={() => deleteTask(task.id)}>×</button>
          </div>
        ))}
        {tasks.length === 0 && <p className="empty-text">No tasks yet.</p>}
      </div>

      <style jsx>{`
        .tasks-section { display: flex; flex-direction: column; gap: 1rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; }
        .section-header h3 { margin: 0; font-size: 1rem; color: #111827; }
        .btn-small { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
        .progress-bar-wrapper { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981, #047857); border-radius: 3px; transition: width 0.5s; }
        .add-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .form-row { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #374151; }
        .form-group input { padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; }
        .btn-primary { background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; align-self: flex-start; }
        .btn-primary:disabled { opacity: 0.5; }
        .tasks-list { display: flex; flex-direction: column; gap: 0.375rem; }
        .task-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
        .task-item.completed { opacity: 0.6; }
        .task-check { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #10b981; padding: 0; line-height: 1; width: 24px; }
        .task-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
        .task-title { font-size: 0.875rem; color: #111827; }
        .task-item.completed .task-title { text-decoration: line-through; color: #9ca3af; }
        .task-assigned { font-size: 0.75rem; color: #6b7280; }
        .btn-danger-small { background: none; color: #ef4444; border: none; font-size: 1.25rem; cursor: pointer; padding: 0; line-height: 1; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
      `}</style>
    </div>
  )
}

/* ========== Reviews Tab ========== */
function ReviewsTab({ reviews, contentItemId }: { reviews: any[]; contentItemId: string }) {
  const [adding, setAdding] = useState(false)
  const [reviewerName, setReviewerName] = useState('')
  const [reviewStatus, setReviewStatus] = useState('approved')
  const [feedback, setFeedback] = useState('')
  const [theologicalAccuracy, setTheologicalAccuracy] = useState('5')
  const [clarity, setClarity] = useState('5')
  const [productionQuality, setProductionQuality] = useState('5')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewerName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId,
          reviewerName: reviewerName.trim(),
          status: reviewStatus,
          feedback: feedback.trim() || undefined,
          theologicalAccuracy: parseInt(theologicalAccuracy),
          clarity: parseInt(clarity),
          productionQuality: parseInt(productionQuality),
        }),
      })
      setReviewerName('')
      setFeedback('')
      setAdding(false)
      mutate(`/api/content/${contentItemId}`)
    } finally {
      setSaving(false)
    }
  }

  const REVIEW_BADGES: Record<string, 'success' | 'warning' | 'error'> = {
    approved: 'success', revision_requested: 'warning', rejected: 'error',
  }

  return (
    <div className="reviews-section">
      <div className="section-header">
        <h3>{reviews.length} Review{reviews.length !== 1 ? 's' : ''}</h3>
        <button className="btn-small" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : '+ Add Review'}</button>
      </div>

      {adding && (
        <Card>
          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-row">
              <div className="form-group">
                <label>Reviewer Name *</label>
                <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Decision</label>
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                  <option value="approved">Approved</option>
                  <option value="revision_requested">Revision Requested</option>
                  <option value="rejected">Rejected</option>
                </select>
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
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Review'}</button>
          </form>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Card><p className="empty-text">No reviews yet.</p></Card>
      ) : (
        <div className="reviews-list">
          {reviews.map((review: any) => (
            <div key={review.id} className="review-item">
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
              <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .reviews-section { display: flex; flex-direction: column; gap: 1rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; }
        .section-header h3 { margin: 0; font-size: 1rem; color: #111827; }
        .btn-small { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
        .review-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .form-row.ratings { grid-template-columns: 1fr 1fr 1fr; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; }
        .btn-primary { background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; align-self: flex-start; }
        .btn-primary:disabled { opacity: 0.5; }
        .reviews-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-item { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .reviewer-name { font-weight: 600; color: #111827; font-size: 0.9rem; }
        .review-ratings { display: flex; gap: 1rem; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.375rem; }
        .review-feedback { font-size: 0.85rem; color: #374151; margin: 0.25rem 0; line-height: 1.5; }
        .review-date { font-size: 0.7rem; color: #9ca3af; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; }
      `}</style>
    </div>
  )
}
