'use client'

// Alerts Page — Alert management with severity filtering

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SEVERITY_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  info: { variant: 'info', label: 'Info' },
  warning: { variant: 'warning', label: 'Warning' },
  error: { variant: 'error', label: 'Error' },
  critical: { variant: 'error', label: 'Critical' },
}

const CATEGORY_LABELS: Record<string, string> = {
  processing_failure: 'Processing Failure',
  translation_error: 'Translation Error',
  capacity_warning: 'Capacity Warning',
  ai_unavailable: 'AI Unavailable',
  distribution_sync: 'Distribution Sync',
  system_error: 'System Error',
}

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const { data, mutate } = useSWR('/api/dashboard/alerts', fetcher, {
    refreshInterval: 15000,
  })

  // Also fetch all alerts for the full list
  const { data: allAlerts } = useSWR('/api/alerts-list', fetcher, {
    refreshInterval: 15000,
  })

  // Use dashboard alerts endpoint for now (shows unread)
  const alerts = data?.alerts || []

  async function markRead(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      setActionMessage('Alert marked as read')
      mutate()
    } catch {
      setActionMessage('Error updating alert')
    }
  }

  async function markResolved(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true, isResolved: true }),
      })
      setActionMessage('Alert resolved')
      mutate()
    } catch {
      setActionMessage('Error resolving alert')
    }
  }

  const filteredAlerts = alerts.filter((alert: any) => {
    if (severityFilter && alert.severity !== severityFilter) return false
    return true
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">
            {data?.total || 0} unread alerts — 15s auto-refresh
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="action-msg success">{actionMessage}</div>
      )}

      {/* Filters */}
      <div className="filters">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="filter-input">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <Card>
            <p className="empty-text">No unread alerts. System is healthy.</p>
          </Card>
        ) : (
          filteredAlerts.map((alert: any) => {
            const severityBadge = SEVERITY_BADGES[alert.severity] || SEVERITY_BADGES.info
            return (
              <Card key={alert.id}>
                <div className="alert-card">
                  <div className="alert-header">
                    <div className="alert-info">
                      <div className="alert-badges">
                        <Badge variant={severityBadge.variant}>{severityBadge.label}</Badge>
                        <Badge variant="neutral" size="sm">
                          {CATEGORY_LABELS[alert.category] || alert.category}
                        </Badge>
                      </div>
                      <p className="alert-message">{alert.message}</p>
                    </div>
                    <div className="alert-actions">
                      <button className="action-btn read" onClick={() => markRead(alert.id)}>
                        Mark Read
                      </button>
                      <button className="action-btn resolve" onClick={() => markResolved(alert.id)}>
                        Resolve
                      </button>
                    </div>
                  </div>
                  <div className="alert-meta">
                    <span className="meta-item">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
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
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .action-msg {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .action-msg.success { background: #d1fae5; color: #065f46; }
        .filters {
          margin-bottom: 1.5rem;
        }
        .filter-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .alert-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .alert-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .alert-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .alert-message {
          font-size: 0.875rem;
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }
        .alert-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .action-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .action-btn.read { background: #f3f4f6; color: #374151; }
        .action-btn.read:hover { background: #e5e7eb; }
        .action-btn.resolve { background: #d1fae5; color: #065f46; }
        .action-btn.resolve:hover { background: #a7f3d0; }
        .alert-meta {
          display: flex;
          gap: 1rem;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
          font-size: 0.875rem;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .alert-header { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
