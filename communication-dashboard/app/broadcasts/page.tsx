'use client'

// Broadcast Management Page
// View scheduled, active, and completed broadcasts

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'info' | 'warning' | 'success' | 'error' | 'orange' | 'neutral'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  sending: { variant: 'orange', label: 'Sending' },
  sent: { variant: 'success', label: 'Sent' },
  partial: { variant: 'warning', label: 'Partial' },
  failed: { variant: 'error', label: 'Failed' },
}

export default function BroadcastsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [broadcastDetail, setBroadcastDetail] = useState<any>(null)
  const [sending, setSending] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)

  const { data, error, mutate } = useSWR(
    `/api/broadcasts?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const loadDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setBroadcastDetail(null)
      return
    }
    try {
      const res = await fetch(`/api/broadcasts/${id}`)
      if (res.ok) {
        const detail = await res.json()
        setBroadcastDetail(detail)
        setExpandedId(id)
      }
    } catch {
      // ignore
    }
  }

  const handleSend = async (id: string) => {
    setSending(id)
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' })
      if (res.ok) {
        mutate()
        if (expandedId === id) {
          loadDetail(id)
        }
      }
    } catch {
      // ignore
    } finally {
      setSending(null)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading broadcasts</h1>
      </div>
    )
  }

  // Group broadcasts
  const pending = data?.broadcasts?.filter((b: any) => b.status === 'pending') || []
  const active = data?.broadcasts?.filter((b: any) => b.status === 'sending') || []
  const completed = data?.broadcasts?.filter((b: any) => ['sent', 'partial', 'failed'].includes(b.status)) || []

  return (
    <div className="broadcasts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Broadcasts</h1>
          <p className="page-subtitle">Scheduled, active, and completed message deliveries</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </select>
        {data && <span className="result-count">{data.total} broadcast{data.total !== 1 ? 's' : ''}</span>}
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading broadcasts...</div>
      ) : data.broadcasts.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            No broadcasts found. Schedule a campaign to create broadcasts.
          </div>
        </Card>
      ) : (
        <div className="broadcast-sections">
          {/* Pending / Scheduled */}
          {pending.length > 0 && (
            <div className="section">
              <h2 className="section-title">Scheduled Queue ({pending.length})</h2>
              {pending.map((broadcast: any) => (
                <BroadcastCard
                  key={broadcast.id}
                  broadcast={broadcast}
                  isExpanded={expandedId === broadcast.id}
                  detail={expandedId === broadcast.id ? broadcastDetail : null}
                  onToggle={() => loadDetail(broadcast.id)}
                  onSend={() => handleSend(broadcast.id)}
                  isSending={sending === broadcast.id}
                />
              ))}
            </div>
          )}

          {/* Active */}
          {active.length > 0 && (
            <div className="section">
              <h2 className="section-title">In Progress ({active.length})</h2>
              {active.map((broadcast: any) => (
                <BroadcastCard
                  key={broadcast.id}
                  broadcast={broadcast}
                  isExpanded={expandedId === broadcast.id}
                  detail={expandedId === broadcast.id ? broadcastDetail : null}
                  onToggle={() => loadDetail(broadcast.id)}
                />
              ))}
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="section">
              <h2 className="section-title">Completed ({completed.length})</h2>
              {completed.map((broadcast: any) => (
                <BroadcastCard
                  key={broadcast.id}
                  broadcast={broadcast}
                  isExpanded={expandedId === broadcast.id}
                  detail={expandedId === broadcast.id ? broadcastDetail : null}
                  onToggle={() => loadDetail(broadcast.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .broadcasts-page {
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
          color: #111827;
          margin: 0;
        }
        .page-subtitle {
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .filters {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
        }
        .result-count {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: auto;
        }
        .broadcast-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem 0;
        }
      `}</style>
    </div>
  )
}

function BroadcastCard({
  broadcast,
  isExpanded,
  detail,
  onToggle,
  onSend,
  isSending,
}: {
  broadcast: any
  isExpanded: boolean
  detail: any
  onToggle: () => void
  onSend?: () => void
  isSending?: boolean
}) {
  const statusBadge = STATUS_BADGES[broadcast.status] || STATUS_BADGES.pending
  const channels: string[] = JSON.parse(broadcast.channels || '[]')
  const deliveryPct = broadcast.totalRecipients > 0
    ? Math.round((broadcast.delivered / broadcast.totalRecipients) * 100)
    : 0

  return (
    <div className="broadcast-wrapper">
      <Card>
        <div className="broadcast-card" onClick={onToggle} role="button" tabIndex={0}>
          <div className="broadcast-row">
            <div className="broadcast-info">
              <h3 className="broadcast-title">{broadcast.campaign?.title || 'Unknown Campaign'}</h3>
              <div className="broadcast-meta">
                <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                <span className="meta-text">
                  {broadcast.segment?.name?.replace(/_/g, ' ')}
                </span>
                <span className="meta-text">{channels.join(', ')}</span>
              </div>
            </div>
            <div className="broadcast-stats">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${deliveryPct}%` }}></div>
              </div>
              <span className="progress-text">
                {broadcast.delivered}/{broadcast.totalRecipients} delivered
                {broadcast.failed > 0 && ` (${broadcast.failed} failed)`}
              </span>
            </div>
            {broadcast.status === 'pending' && onSend && (
              <button
                className="send-btn"
                onClick={(e) => { e.stopPropagation(); onSend(); }}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Now'}
              </button>
            )}
          </div>
          <div className="broadcast-footer">
            {broadcast.scheduledAt && (
              <span className="time-text">Scheduled: {new Date(broadcast.scheduledAt).toLocaleString()}</span>
            )}
            {broadcast.sentAt && (
              <span className="time-text">Sent: {new Date(broadcast.sentAt).toLocaleString()}</span>
            )}
            <span className="expand-text">{isExpanded ? '▲ Hide' : '▼ Details'}</span>
          </div>
        </div>
      </Card>

      {/* Expanded Detail */}
      {isExpanded && detail && (
        <div className="detail-panel">
          {/* Channel Breakdown */}
          {detail.channelStats && Object.keys(detail.channelStats).length > 0 && (
            <Card title="Channel Breakdown">
              <div className="channel-table">
                <div className="ch-header">
                  <span>Channel</span>
                  <span>Sent</span>
                  <span>Delivered</span>
                  <span>Failed</span>
                  <span>Opened</span>
                </div>
                {Object.entries(detail.channelStats).map(([ch, stats]: [string, any]) => (
                  <div key={ch} className="ch-row">
                    <span className="ch-name">{ch}</span>
                    <span>{stats.sent}</span>
                    <span className="ch-delivered">{stats.delivered}</span>
                    <span className="ch-failed">{stats.failed}</span>
                    <span>{stats.opened}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Failure Reasons */}
          {detail.failureReasons && Object.keys(detail.failureReasons).length > 0 && (
            <Card title="Failure Reasons">
              <div className="failure-list">
                {Object.entries(detail.failureReasons).map(([reason, count]: [string, any]) => (
                  <div key={reason} className="failure-item">
                    <span className="failure-reason">{reason}</span>
                    <Badge variant="error" size="sm">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Delivery Log */}
          <Card title="Delivery Log" subtitle={`${detail.deliveries?.length || 0} entries`}>
            <div className="delivery-table">
              <div className="del-header">
                <span>Contact</span>
                <span>Channel</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {(detail.deliveries || []).slice(0, 50).map((d: any) => (
                <div key={d.id} className="del-row">
                  <span className="del-name">{d.contact?.name || 'Unknown'}</span>
                  <span>{d.channel}</span>
                  <span>
                    <Badge
                      variant={
                        d.status === 'delivered' || d.status === 'opened' ? 'success' :
                        d.status === 'failed' ? 'error' :
                        d.status === 'sent' ? 'info' : 'neutral'
                      }
                      size="sm"
                    >
                      {d.status}
                    </Badge>
                  </span>
                  <span className="del-time">
                    {d.sentAt ? new Date(d.sentAt).toLocaleString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        .broadcast-wrapper {
          margin-bottom: 0.75rem;
        }
        .broadcast-card {
          cursor: pointer;
        }
        .broadcast-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .broadcast-info {
          flex: 1;
        }
        .broadcast-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.375rem 0;
        }
        .broadcast-meta {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .meta-text {
          font-size: 0.8125rem;
          color: #6b7280;
          text-transform: capitalize;
        }
        .broadcast-stats {
          min-width: 200px;
        }
        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }
        .progress-fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
          transition: width 0.3s;
        }
        .progress-text {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .send-btn {
          background: #2563eb;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .send-btn:hover:not(:disabled) { background: #1d4ed8; }
        .broadcast-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .time-text {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .expand-text {
          font-size: 0.75rem;
          color: #2563eb;
        }
        .detail-panel {
          margin-top: 0.5rem;
          margin-left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .channel-table, .delivery-table {
          font-size: 0.8125rem;
        }
        .ch-header, .del-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #6b7280;
        }
        .del-header {
          grid-template-columns: 2fr 1.5fr 1fr 2fr;
        }
        .ch-row, .del-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
          color: #374151;
        }
        .del-row {
          grid-template-columns: 2fr 1.5fr 1fr 2fr;
        }
        .ch-name { text-transform: capitalize; font-weight: 500; }
        .ch-delivered { color: #10b981; font-weight: 600; }
        .ch-failed { color: #ef4444; font-weight: 600; }
        .del-name { font-weight: 500; }
        .del-time { font-size: 0.75rem; color: #9ca3af; }
        .failure-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .failure-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #fef2f2;
          border-radius: 6px;
        }
        .failure-reason {
          font-size: 0.8125rem;
          color: #991b1b;
        }
        @media (max-width: 768px) {
          .broadcast-row { flex-direction: column; align-items: flex-start; }
          .broadcast-stats { min-width: auto; width: 100%; }
        }
      `}</style>
    </div>
  )
}
