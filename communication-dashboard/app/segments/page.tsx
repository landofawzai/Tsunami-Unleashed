'use client'

// Segments Management Page
// View, create, and manage audience segments

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SEGMENT_COLORS: Record<string, 'info' | 'purple' | 'success' | 'warning' | 'orange'> = {
  field_leaders: 'orange',
  supporters: 'success',
  seekers: 'info',
  prayer_partners: 'purple',
  translators: 'warning',
}

export default function SegmentsPage() {
  const { data, error, mutate } = useSWR('/api/segments', fetcher, {
    refreshInterval: 30000,
  })

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [createError, setCreateError] = useState('')
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
  const [segmentDetail, setSegmentDetail] = useState<any>(null)

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError('Name is required')
      return
    }
    try {
      setCreateError('')
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      mutate()
    } catch (err: any) {
      setCreateError(err.message)
    }
  }

  const loadSegmentDetail = async (idOrName: string) => {
    if (expandedSegment === idOrName) {
      setExpandedSegment(null)
      setSegmentDetail(null)
      return
    }
    try {
      const res = await fetch(`/api/segments/${idOrName}`)
      if (res.ok) {
        const detail = await res.json()
        setSegmentDetail(detail)
        setExpandedSegment(idOrName)
      }
    } catch {
      // ignore
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading segments</h1>
      </div>
    )
  }

  return (
    <div className="segments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audience Segments</h1>
          <p className="page-subtitle">Group contacts for targeted messaging</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="create-btn">
          {showCreate ? 'Cancel' : '+ Create Segment'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create New Segment">
          {createError && <p className="form-error">{createError}</p>}
          <div className="create-form">
            <div className="form-field">
              <label>Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. new_believers"
              />
              <span className="hint">Use lowercase with underscores</span>
            </div>
            <div className="form-field">
              <label>Description</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What defines this audience?"
              />
            </div>
            <button onClick={handleCreate} className="save-btn">Create Segment</button>
          </div>
        </Card>
      )}

      {/* Segment List */}
      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading segments...</div>
      ) : (
        <div className="segment-list">
          {data.segments.map((segment: any) => {
            const badgeColor = SEGMENT_COLORS[segment.name] || 'info'
            const isExpanded = expandedSegment === segment.id
            return (
              <div key={segment.id}>
                <Card>
                  <div
                    className="segment-card"
                    onClick={() => loadSegmentDetail(segment.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="segment-top">
                      <div className="segment-info">
                        <Badge variant={badgeColor} size="md">
                          {segment.name.replace(/_/g, ' ')}
                        </Badge>
                        {segment.description && (
                          <p className="segment-desc">{segment.description}</p>
                        )}
                      </div>
                      <div className="segment-stats">
                        <div className="stat-box">
                          <span className="stat-num">{segment.contactCount}</span>
                          <span className="stat-lbl">Contacts</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-num">{segment._count.broadcasts}</span>
                          <span className="stat-lbl">Broadcasts</span>
                        </div>
                      </div>
                    </div>
                    <span className="expand-indicator">{isExpanded ? '▲' : '▼'} View contacts</span>
                  </div>
                </Card>

                {/* Expanded Contact List */}
                {isExpanded && segmentDetail && (
                  <div className="expanded-contacts">
                    <Card subtitle={`${segmentDetail.contacts.length} contacts in this segment`}>
                      {segmentDetail.contacts.length === 0 ? (
                        <p className="empty">No contacts in this segment</p>
                      ) : (
                        <div className="contact-table">
                          <div className="table-header">
                            <span>Name</span>
                            <span>Email</span>
                            <span>Region</span>
                            <span>Language</span>
                            <span>Status</span>
                          </div>
                          {segmentDetail.contacts.map((cs: any) => (
                            <div key={cs.contact.id} className="table-row">
                              <span className="cell-name">{cs.contact.name}</span>
                              <span className="cell-email">{cs.contact.email || '-'}</span>
                              <span>{cs.contact.region || '-'}</span>
                              <span>{cs.contact.language}</span>
                              <span>
                                <Badge
                                  variant={cs.contact.isActive ? 'success' : 'neutral'}
                                  size="sm"
                                >
                                  {cs.contact.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .segments-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .page-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .create-btn {
          background: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .create-btn:hover { background: #1d4ed8; }
        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin: 0 0 0.75rem 0;
        }
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-field label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        .form-field input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .hint {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .save-btn {
          background: #10b981;
          color: white;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .save-btn:hover { background: #059669; }
        .segment-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .segment-card {
          cursor: pointer;
        }
        .segment-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .segment-info {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .segment-desc {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0;
        }
        .segment-stats {
          display: flex;
          gap: 1.5rem;
        }
        .stat-box {
          text-align: center;
        }
        .stat-num {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }
        .stat-lbl {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .expand-indicator {
          font-size: 0.75rem;
          color: #2563eb;
        }
        .expanded-contacts {
          margin-top: 0.5rem;
          margin-left: 1rem;
        }
        .empty {
          color: #9ca3af;
          text-align: center;
          padding: 1rem;
          font-size: 0.875rem;
        }
        .contact-table {
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
        }
        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #6b7280;
        }
        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
          color: #374151;
        }
        .cell-name { font-weight: 600; }
        .cell-email { color: #6b7280; }
        @media (max-width: 768px) {
          .segment-top { flex-direction: column; }
          .table-header, .table-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
