'use client'

// Emergency Alert Page
// Immediate broadcast bypassing normal scheduling

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function UrgentPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [selectedChannels, setSelectedChannels] = useState(['email', 'sms', 'whatsapp', 'telegram', 'signal', 'social_media'])
  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const { data: segmentData } = useSWR('/api/segments', fetcher)
  const { data: urgentHistory } = useSWR('/api/campaigns?type=urgent&limit=10', fetcher, {
    refreshInterval: 30000,
  })

  const toggleSegment = (name: string) => {
    setSelectedSegments((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
  }

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const totalContacts = segmentData?.segments
    ?.filter((s: any) => selectedSegments.length === 0 || selectedSegments.includes(s.name))
    ?.reduce((sum: number, s: any) => sum + s.contactCount, 0) || 0

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required')
      return
    }
    setSending(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/campaigns/urgent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          segmentNames: selectedSegments.length > 0 ? selectedSegments : undefined,
          channels: selectedChannels,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      const data = await res.json()
      setResult(data)
      setTitle('')
      setBody('')
      setShowConfirm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="urgent-page">
      <div className="page-header">
        <div className="urgent-banner">
          <h1 className="page-title">Emergency Alerts</h1>
          <p className="page-subtitle">Immediate broadcast - bypasses approval and scheduling</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {result && (
        <div className="success-msg">
          {result.message}
        </div>
      )}

      <div className="urgent-grid">
        {/* Compose */}
        <div className="compose-col">
          <Card title="Compose Emergency Alert">
            <div className="form-field">
              <label>Alert Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. URGENT: Security situation in region X"
                className="field-input urgent-input"
              />
            </div>
            <div className="form-field">
              <label>Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the situation and any instructions..."
                className="field-textarea"
                rows={6}
              />
            </div>

            {/* Segments */}
            <div className="form-field">
              <label>Target Segments (empty = ALL)</label>
              <div className="segment-grid">
                {segmentData?.segments?.map((seg: any) => (
                  <button
                    key={seg.id}
                    className={`seg-btn ${selectedSegments.includes(seg.name) ? 'selected' : ''}`}
                    onClick={() => toggleSegment(seg.name)}
                  >
                    {seg.name.replace(/_/g, ' ')} ({seg.contactCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="form-field">
              <label>Channels</label>
              <div className="channel-grid">
                {[
                  { id: 'email', label: 'Email' },
                  { id: 'sms', label: 'SMS' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'telegram', label: 'Telegram' },
                  { id: 'signal', label: 'Signal' },
                  { id: 'social_media', label: 'Social' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    className={`ch-btn ${selectedChannels.includes(ch.id) ? 'selected' : ''}`}
                    onClick={() => toggleChannel(ch.id)}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!title.trim() || !body.trim()}
                className="prepare-btn"
              >
                Prepare Emergency Alert
              </button>
            ) : (
              <div className="confirm-box">
                <div className="confirm-header">
                  <Badge variant="error" size="lg">CONFIRM IMMEDIATE SEND</Badge>
                </div>
                <p className="confirm-text">
                  This will send to approximately <strong>{totalContacts}</strong> contacts
                  across <strong>{selectedChannels.length}</strong> channel(s)
                  {selectedSegments.length > 0
                    ? ` in ${selectedSegments.length} segment(s)`
                    : ' in ALL segments'}
                  . This action cannot be undone.
                </p>
                <div className="confirm-actions">
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="send-btn"
                  >
                    {sending ? 'SENDING...' : 'SEND IMMEDIATELY'}
                  </button>
                  <button onClick={() => setShowConfirm(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* History */}
        <div className="history-col">
          <Card title="Past Emergency Alerts">
            {!urgentHistory ? (
              <p className="loading">Loading...</p>
            ) : urgentHistory.campaigns?.length === 0 ? (
              <p className="empty">No emergency alerts sent</p>
            ) : (
              <div className="alert-list">
                {urgentHistory.campaigns.map((c: any) => (
                  <div key={c.id} className="alert-item">
                    <div className="alert-top">
                      <Badge variant="error" size="sm">URGENT</Badge>
                      <Badge
                        variant={c.status === 'sent' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <span className="alert-title">{c.title}</span>
                    <span className="alert-date">
                      {new Date(c.sentAt || c.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <style jsx>{`
        .urgent-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .urgent-banner {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          padding: 1.5rem 2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .page-subtitle {
          color: rgba(255,255,255,0.85);
          margin: 0.25rem 0 0 0;
        }
        .error-msg {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .success-msg {
          background: #d1fae5;
          color: #065f46;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .urgent-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .compose-col, .history-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-field {
          margin-bottom: 1rem;
        }
        .form-field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.375rem;
        }
        .field-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          box-sizing: border-box;
        }
        .urgent-input {
          border-color: #fca5a5;
        }
        .field-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
        }
        .segment-grid, .channel-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .seg-btn, .ch-btn {
          padding: 0.5rem 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          font-size: 0.8125rem;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .seg-btn.selected {
          border-color: #ef4444;
          background: #fee2e2;
        }
        .ch-btn.selected {
          border-color: #ef4444;
          background: #fee2e2;
        }
        .prepare-btn {
          background: #f97316;
          color: white;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
        }
        .prepare-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .confirm-box {
          background: #fef2f2;
          border: 2px solid #ef4444;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        .confirm-header {
          margin-bottom: 0.75rem;
        }
        .confirm-text {
          font-size: 0.875rem;
          color: #374151;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }
        .confirm-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .send-btn {
          background: #ef4444;
          color: white;
          padding: 0.875rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          letter-spacing: 0.05em;
        }
        .send-btn:hover:not(:disabled) { background: #dc2626; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cancel-btn {
          background: white;
          color: #374151;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .loading, .empty {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }
        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-item {
          padding: 0.75rem;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 3px solid #ef4444;
        }
        .alert-top {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
        }
        .alert-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        .alert-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        @media (max-width: 1024px) {
          .urgent-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
