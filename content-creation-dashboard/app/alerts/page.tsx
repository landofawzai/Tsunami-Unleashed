// Alerts Page
// Alert management — view, filter, mark read/resolved

'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SEVERITY_BADGES: Record<string, 'error' | 'warning' | 'info'> = {
  critical: 'error', warning: 'warning', info: 'info',
}

export default function AlertsPage() {
  const [showResolved, setShowResolved] = useState(false)

  const { data, error } = useSWR('/api/dashboard/alerts', fetcher, {
    refreshInterval: 30000,
  })

  // Also fetch all alerts for full list
  const { data: allData } = useSWR('/api/alerts-list', fetcher, {
    refreshInterval: 30000,
  })

  // Since we don't have a dedicated all-alerts endpoint, use dashboard alerts
  // and supplement. For now use the dashboard data.
  const alerts = data?.alerts || []
  const total = data?.total || 0

  async function markRead(id: string) {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    })
    mutate('/api/dashboard/alerts')
  }

  async function markResolved(id: string) {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true, isResolved: true }),
    })
    mutate('/api/dashboard/alerts')
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">{total} unread alert{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error ? (
        <Card><p className="error-text">Failed to load alerts</p></Card>
      ) : !data ? (
        <Card>
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="empty-state">
            <div className="empty-icon">&#10003;</div>
            <p className="empty-text">No unread alerts. All clear!</p>
          </div>
        </Card>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert: any) => (
            <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
              <div className="alert-header">
                <div className="alert-badges">
                  <Badge variant={SEVERITY_BADGES[alert.severity] || 'info'} size="sm">
                    {alert.severity}
                  </Badge>
                  <span className="alert-category">{alert.category}</span>
                </div>
                <span className="alert-time">{new Date(alert.createdAt).toLocaleString()}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
              {alert.details && (
                <pre className="alert-details">{JSON.stringify(JSON.parse(alert.details), null, 2)}</pre>
              )}
              <div className="alert-actions">
                <button className="btn-small" onClick={() => markRead(alert.id)}>Mark Read</button>
                <button className="btn-small resolve" onClick={() => markResolved(alert.id)}>Resolve</button>
                {alert.relatedContentId && (
                  <a href={`/content/${alert.relatedContentId}`} className="alert-link">View Content</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .alerts-page { padding: 2rem; max-width: 900px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }

        .alerts-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .alert-card {
          background: white; border-radius: 12px; padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;
        }
        .alert-card.severity-critical { border-left-color: #ef4444; }
        .alert-card.severity-warning { border-left-color: #f59e0b; }
        .alert-card.severity-info { border-left-color: #3b82f6; }

        .alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .alert-badges { display: flex; align-items: center; gap: 0.5rem; }
        .alert-category { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .alert-time { font-size: 0.75rem; color: #9ca3af; }
        .alert-message { font-size: 0.9rem; color: #111827; margin: 0 0 0.5rem 0; line-height: 1.5; }
        .alert-details {
          font-size: 0.75rem; background: #f9fafb; padding: 0.75rem;
          border-radius: 6px; overflow-x: auto; margin: 0 0 0.75rem 0; color: #374151;
        }
        .alert-actions { display: flex; gap: 0.5rem; align-items: center; }
        .btn-small {
          background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
          padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem;
          cursor: pointer; font-weight: 500;
        }
        .btn-small:hover { background: #e5e7eb; }
        .btn-small.resolve { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
        .btn-small.resolve:hover { background: #a7f3d0; }
        .alert-link { font-size: 0.8rem; color: #10b981; text-decoration: none; font-weight: 500; }
        .alert-link:hover { text-decoration: underline; }

        .empty-state { text-align: center; padding: 3rem; }
        .empty-icon { font-size: 3rem; color: #10b981; margin-bottom: 0.5rem; }
        .empty-text { color: #9ca3af; margin: 0; }
        .error-text { color: #991b1b; text-align: center; margin: 0; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) { .alerts-page { padding: 1rem; } }
      `}</style>
    </div>
  )
}
