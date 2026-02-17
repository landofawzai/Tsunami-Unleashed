'use client'

// Sequences List Page
// View and create automated drip campaign sequences

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SequencesPage() {
  const { data, error, mutate } = useSWR('/api/sequences', fetcher, {
    refreshInterval: 30000,
  })
  const { data: segmentData } = useSWR('/api/segments', fetcher)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSegment, setNewSegment] = useState('')
  const [newTrigger, setNewTrigger] = useState('manual')
  const [createError, setCreateError] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError('Name is required')
      return
    }
    try {
      setCreateError('')
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          segmentId: newSegment || null,
          trigger: newTrigger,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setNewName('')
      setNewDesc('')
      setNewSegment('')
      setNewTrigger('manual')
      setShowCreate(false)
      mutate()
    } catch (err: any) {
      setCreateError(err.message)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading sequences</h1>
      </div>
    )
  }

  return (
    <div className="sequences-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sequences</h1>
          <p className="page-subtitle">Automated multi-step drip campaigns</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="create-btn">
          {showCreate ? 'Cancel' : '+ Create Sequence'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create New Sequence">
          {createError && <p className="form-error">{createError}</p>}
          <div className="create-form">
            <div className="form-field">
              <label>Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. New Field Worker Onboarding" />
            </div>
            <div className="form-field">
              <label>Description</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this sequence for?" />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Trigger</label>
                <select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}>
                  <option value="manual">Manual enrollment</option>
                  <option value="segment_join">When contact joins segment</option>
                  <option value="webhook">Webhook trigger</option>
                </select>
              </div>
              <div className="form-field">
                <label>Auto-enroll Segment</label>
                <select value={newSegment} onChange={(e) => setNewSegment(e.target.value)}>
                  <option value="">None</option>
                  {segmentData?.segments?.map((seg: any) => (
                    <option key={seg.id} value={seg.id}>{seg.name.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleCreate} className="save-btn">Create Sequence</button>
          </div>
        </Card>
      )}

      {/* Sequence List */}
      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading sequences...</div>
      ) : data.sequences.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            No sequences yet. Create your first automated sequence.
          </div>
        </Card>
      ) : (
        <div className="sequence-list">
          {data.sequences.map((seq: any) => (
            <Link key={seq.id} href={`/sequences/${seq.id}`} className="seq-link">
              <Card>
                <div className="seq-card">
                  <div className="seq-top">
                    <div className="seq-info">
                      <h3 className="seq-name">{seq.name}</h3>
                      {seq.description && <p className="seq-desc">{seq.description}</p>}
                    </div>
                    <div className="seq-badges">
                      <Badge
                        variant={seq.status === 'active' ? 'success' : seq.status === 'paused' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {seq.status}
                      </Badge>
                      <Badge variant="info" size="sm">{seq.trigger.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <div className="seq-meta">
                    <div className="meta-item">
                      <span className="meta-num">{seq._count.steps}</span>
                      <span className="meta-label">Steps</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-num active">{seq.enrollmentStats?.active || 0}</span>
                      <span className="meta-label">Active</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-num completed">{seq.enrollmentStats?.completed || 0}</span>
                      <span className="meta-label">Completed</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-num">{seq._count.enrollments}</span>
                      <span className="meta-label">Total Enrolled</span>
                    </div>
                  </div>
                  {seq.segment && (
                    <div className="seq-segment">
                      <Badge variant="purple" size="sm">
                        {seq.segment.name.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .sequences-page {
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
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
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
        .form-field input, .form-field select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
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
        .sequence-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .seq-link {
          text-decoration: none;
          color: inherit;
        }
        .seq-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .seq-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .seq-info { flex: 1; }
        .seq-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .seq-desc {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .seq-badges {
          display: flex;
          gap: 0.5rem;
        }
        .seq-meta {
          display: flex;
          gap: 2rem;
        }
        .meta-item {
          text-align: center;
        }
        .meta-num {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .meta-num.active { color: #2563eb; }
        .meta-num.completed { color: #10b981; }
        .meta-label {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .seq-segment {
          padding-top: 0.375rem;
        }
        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .form-row { grid-template-columns: 1fr; }
          .seq-top { flex-direction: column; }
          .seq-meta { flex-wrap: wrap; gap: 1rem; }
        }
      `}</style>
    </div>
  )
}
