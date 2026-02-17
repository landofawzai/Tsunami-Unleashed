'use client'

// Sequence Detail Page
// View steps, enrollments, and manage a sequence

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const ENROLLMENT_STATUS: Record<string, { variant: 'info' | 'success' | 'warning' | 'neutral' | 'error'; label: string }> = {
  active: { variant: 'info', label: 'Active' },
  completed: { variant: 'success', label: 'Completed' },
  paused: { variant: 'warning', label: 'Paused' },
  exited: { variant: 'neutral', label: 'Exited' },
}

export default function SequenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sequenceId = params.id as string

  const { data: sequence, error, mutate } = useSWR(
    `/api/sequences/${sequenceId}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const [showAddStep, setShowAddStep] = useState(false)
  const [stepBody, setStepBody] = useState('')
  const [stepSubject, setStepSubject] = useState('')
  const [stepDelay, setStepDelay] = useState(0)
  const [stepChannels, setStepChannels] = useState<string[]>(['email'])
  const [addError, setAddError] = useState('')
  const [toggling, setToggling] = useState(false)

  const toggleChannel = (ch: string) => {
    setStepChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const handleAddStep = async () => {
    if (!stepBody.trim()) {
      setAddError('Step message body is required')
      return
    }
    try {
      setAddError('')
      const res = await fetch(`/api/sequences/${sequenceId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delayDays: stepDelay,
          subject: stepSubject || null,
          body: stepBody,
          channels: stepChannels,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setStepBody('')
      setStepSubject('')
      setStepDelay(0)
      setStepChannels(['email'])
      setShowAddStep(false)
      mutate()
    } catch (err: any) {
      setAddError(err.message)
    }
  }

  const handleTogglePause = async () => {
    setToggling(true)
    try {
      const res = await fetch(`/api/sequences/${sequenceId}/pause`, {
        method: 'POST',
      })
      if (res.ok) mutate()
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading sequence</h1>
      </div>
    )
  }

  if (!sequence || sequence.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        {sequence?.error ? 'Sequence not found' : 'Loading sequence...'}
      </div>
    )
  }

  const activeEnrollments = sequence.enrollments?.filter((e: any) => e.status === 'active') || []
  const completedEnrollments = sequence.enrollments?.filter((e: any) => e.status === 'completed') || []

  return (
    <div className="detail-page">
      {/* Header */}
      <button onClick={() => router.push('/sequences')} className="back-btn">&larr; Back to Sequences</button>
      <div className="header-row">
        <div>
          <h1 className="page-title">{sequence.name}</h1>
          {sequence.description && <p className="page-desc">{sequence.description}</p>}
        </div>
        <div className="header-actions">
          <Badge variant={sequence.status === 'active' ? 'success' : 'warning'} size="md">
            {sequence.status}
          </Badge>
          <button onClick={handleTogglePause} disabled={toggling} className="toggle-btn">
            {sequence.status === 'active' ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Steps */}
        <div className="main-col">
          <Card title="Step Timeline" subtitle={`${sequence.steps?.length || 0} steps`}>
            <div className="steps-timeline">
              {(sequence.steps || []).map((step: any, i: number) => {
                const channels: string[] = JSON.parse(step.channels || '["email"]')
                return (
                  <div key={step.id} className="step-item">
                    <div className="step-marker">
                      <div className="step-num">{step.stepNumber}</div>
                      {i < sequence.steps.length - 1 && <div className="step-line"></div>}
                    </div>
                    <div className="step-content">
                      <div className="step-header">
                        <span className="step-title">
                          {step.subject || `Step ${step.stepNumber}`}
                        </span>
                        <Badge variant="neutral" size="sm">
                          Day {step.delayDays === 0 ? '0 (immediate)' : `+${step.delayDays}`}
                        </Badge>
                      </div>
                      <pre className="step-body">{step.body}</pre>
                      <div className="step-channels">
                        {channels.map((ch) => (
                          <Badge key={ch} variant="info" size="sm">{ch}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowAddStep(!showAddStep)} className="add-step-btn">
              {showAddStep ? 'Cancel' : '+ Add Step'}
            </button>

            {showAddStep && (
              <div className="add-step-form">
                {addError && <p className="form-error">{addError}</p>}
                <div className="form-field">
                  <label>Subject (optional)</label>
                  <input value={stepSubject} onChange={(e) => setStepSubject(e.target.value)} placeholder="Email subject line" />
                </div>
                <div className="form-field">
                  <label>Message Body</label>
                  <textarea value={stepBody} onChange={(e) => setStepBody(e.target.value)} placeholder="Step message..." rows={5} />
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Delay (days after previous)</label>
                    <input type="number" min="0" value={stepDelay} onChange={(e) => setStepDelay(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-field">
                    <label>Channels</label>
                    <div className="ch-checks">
                      {['email', 'sms', 'whatsapp', 'telegram', 'signal'].map((ch) => (
                        <label key={ch} className="ch-label">
                          <input type="checkbox" checked={stepChannels.includes(ch)} onChange={() => toggleChannel(ch)} />
                          {ch}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleAddStep} className="save-btn">Add Step</button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="side-col">
          {/* Stats */}
          <Card title="Enrollment Stats">
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-num active">{activeEnrollments.length}</span>
                <span className="stat-lbl">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-num completed">{completedEnrollments.length}</span>
                <span className="stat-lbl">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{sequence.enrollments?.length || 0}</span>
                <span className="stat-lbl">Total</span>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card title="Sequence Info">
            <div className="info-list">
              <div className="info-row"><span>Trigger</span><span>{sequence.trigger?.replace('_', ' ')}</span></div>
              <div className="info-row"><span>Segment</span><span>{sequence.segment?.name?.replace(/_/g, ' ') || 'None'}</span></div>
              <div className="info-row"><span>Steps</span><span>{sequence.totalSteps}</span></div>
              <div className="info-row"><span>Created</span><span>{new Date(sequence.createdAt).toLocaleDateString()}</span></div>
            </div>
          </Card>

          {/* Enrollments */}
          <Card title="Enrolled Contacts" subtitle={`${sequence.enrollments?.length || 0} contacts`}>
            <div className="enrollment-list">
              {(sequence.enrollments || []).slice(0, 20).map((en: any) => {
                const statusBadge = ENROLLMENT_STATUS[en.status] || ENROLLMENT_STATUS.active
                return (
                  <div key={en.id} className="enrollment-item">
                    <div className="en-top">
                      <span className="en-name">{en.contact?.name}</span>
                      <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                    </div>
                    <div className="en-meta">
                      <span>Step {en.currentStep}/{sequence.totalSteps}</span>
                      {en.nextSendAt && <span>Next: {new Date(en.nextSendAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )
              })}
              {(sequence.enrollments?.length || 0) === 0 && (
                <p className="empty">No contacts enrolled yet</p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <style jsx>{`
        .detail-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .back-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.75rem;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .page-desc {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .toggle-btn:disabled { opacity: 0.5; }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .main-col, .side-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .steps-timeline {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }
        .step-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .step-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 32px;
        }
        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-line {
          width: 2px;
          flex: 1;
          background: #d1d5db;
          min-height: 20px;
        }
        .step-content {
          flex: 1;
          padding-bottom: 1rem;
        }
        .step-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .step-title {
          font-weight: 600;
          color: #111827;
          font-size: 0.875rem;
        }
        .step-body {
          font-size: 0.8125rem;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f9fafb;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 0 0 0.5rem 0;
          font-family: inherit;
          line-height: 1.5;
        }
        .step-channels {
          display: flex;
          gap: 0.375rem;
        }
        .add-step-btn {
          background: #f3f4f6;
          color: #2563eb;
          padding: 0.5rem 1rem;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          width: 100%;
        }
        .add-step-form {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin: 0;
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
        .form-field input, .form-field textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 0.75rem;
        }
        .ch-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .ch-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          cursor: pointer;
          text-transform: capitalize;
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
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          text-align: center;
        }
        .stat-num {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }
        .stat-num.active { color: #2563eb; }
        .stat-num.completed { color: #10b981; }
        .stat-lbl {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          padding: 0.375rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row span:first-child { color: #6b7280; }
        .info-row span:last-child { font-weight: 600; color: #111827; text-transform: capitalize; }
        .enrollment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .enrollment-item {
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        .en-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .en-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .en-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .empty {
          color: #9ca3af;
          text-align: center;
          font-size: 0.875rem;
          padding: 1rem;
        }
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
