'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AlertsPage() {
  const [page, setPage] = useState(1)
  const [severityFilter, setSeverityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')

  const queryParams = new URLSearchParams({
    page: page.toString(),
    ...(severityFilter && { severity: severityFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(readFilter && { isRead: readFilter }),
  })

  const { data, error } = useSWR(`/api/alerts?${queryParams}`, fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading alerts</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔 Alerts</h1>
        <p style={{ color: '#6b7280' }}>Monitor system alerts and warnings</p>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Alerts" value={data.stats.total} icon="🔔" color="blue" />
        <StatCard label="Unread" value={data.stats.unread} icon="📬" color="yellow" />
        <StatCard label="Critical" value={data.stats.critical} icon="🚨" color="red" />
        <StatCard label="Warnings" value={data.stats.warning} icon="⚠️" color="yellow" />
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Categories</option>
              <option value="platform_down">Platform Down</option>
              <option value="high_failure_rate">High Failure Rate</option>
              <option value="capacity_warning">Capacity Warning</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>
              Status
            </label>
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Alerts</option>
              <option value="false">Unread Only</option>
              <option value="true">Read Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="Alert History"
          subtitle={`${data.pagination.total} total alerts • Page ${page} of ${data.pagination.totalPages}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.alerts.map((alert: any) => (
              <div
                key={alert.id}
                style={{
                  padding: '1rem',
                  background: alert.isRead ? '#f9fafb' : '#fefce8',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${
                    alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Badge
                        variant={
                          alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'
                        }
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {alert.category.replace(/_/g, ' ')}
                      </Badge>
                      {!alert.isRead && (
                        <Badge variant="warning" size="sm">
                          Unread
                        </Badge>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                      {alert.message}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      {alert.relatedPlatform && <span>Platform: {alert.relatedPlatform}</span>}
                      {alert.relatedContentId && <span>Content ID: {alert.relatedContentId}</span>}
                      <span>•</span>
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: page === 1 ? '#f3f4f6' : 'white',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#374151' }}>
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: page === data.pagination.totalPages ? '#f3f4f6' : 'white',
                  cursor: page === data.pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: '#2563eb', fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
