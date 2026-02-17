'use client'

// Prayer Request Broadcaster
// Streamlined form for sending prayer requests to prayer partners

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { StatCard } from '@/components/StatCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PrayerPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedChannels, setSelectedChannels] = useState(['email', 'whatsapp', 'telegram'])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const { data: campaigns } = useSWR('/api/campaigns?type=prayer&limit=10', fetcher, {
    refreshInterval: 30000,
  })

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and prayer request are required')
      return
    }
    setSending(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/campaigns/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          channels: selectedChannels,
          sendImmediately: true,
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="prayer-page">
      <div className="page-header">
        <h1 className="page-title">Prayer Requests</h1>
        <p className="page-subtitle">Send prayer needs to prayer partners immediately</p>
      </div>

      <div className="prayer-grid">
        {/* Compose */}
        <div className="compose-col">
          <Card title="New Prayer Request" subtitle="This will be sent to all prayer partners">
            {error && <div className="error-msg">{error}</div>}
            {result && (
              <div className="success-msg">
                {result.message}
              </div>
            )}
            <div className="form-field">
              <label>Prayer Need</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Healing for Brother David in Nairobi"
                className="field-input"
              />
            </div>
            <div className="form-field">
              <label>Details</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share the prayer request details. This will be adapted for each channel..."
                className="field-textarea"
                rows={6}
              />
            </div>
            <div className="form-field">
              <label>Channels</label>
              <div className="channel-grid">
                {[
                  { id: 'email', icon: '📧', label: 'Email' },
                  { id: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                  { id: 'telegram', icon: '✈️', label: 'Telegram' },
                  { id: 'signal', icon: '🔒', label: 'Signal' },
                  { id: 'sms', icon: '📱', label: 'SMS' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    className={`channel-btn ${selectedChannels.includes(ch.id) ? 'selected' : ''}`}
                    onClick={() => toggleChannel(ch.id)}
                  >
                    {ch.icon} {ch.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="send-btn"
            >
              {sending ? 'Sending Prayer Request...' : 'Send Prayer Request'}
            </button>
          </Card>
        </div>

        {/* History */}
        <div className="history-col">
          <Card title="Recent Prayer Broadcasts">
            {!campaigns ? (
              <p className="loading">Loading...</p>
            ) : campaigns.campaigns?.length === 0 ? (
              <p className="empty">No prayer broadcasts yet</p>
            ) : (
              <div className="prayer-list">
                {campaigns.campaigns.map((c: any) => (
                  <div key={c.id} className="prayer-item">
                    <div className="prayer-top">
                      <span className="prayer-title">{c.title}</span>
                      <Badge
                        variant={c.status === 'sent' ? 'success' : c.status === 'sending' ? 'orange' : 'neutral'}
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <span className="prayer-date">
                      {new Date(c.sentAt || c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <style jsx>{`
        .prayer-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #5b21b6;
          margin: 0;
        }
        .page-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .prayer-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .compose-col, .history-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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
        .channel-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .channel-btn {
          padding: 0.5rem 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .channel-btn.selected {
          border-color: #7c3aed;
          background: #ede9fe;
        }
        .send-btn {
          background: #7c3aed;
          color: white;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }
        .send-btn:hover:not(:disabled) { background: #6d28d9; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading, .empty {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }
        .prayer-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .prayer-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .prayer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .prayer-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .prayer-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        @media (max-width: 1024px) {
          .prayer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
