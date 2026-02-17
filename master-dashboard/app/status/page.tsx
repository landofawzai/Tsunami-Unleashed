'use client'

import useSWR from 'swr'
import { PILLARS } from '@/lib/pillar-config'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Endpoint directory — known routes for each pillar
const PILLAR_ENDPOINTS: Record<string, { method: string; path: string; description: string }[]> = {
  creation: [
    { method: 'POST', path: '/api/webhooks/content-from-drive', description: 'Ingest content from Google Drive' },
    { method: 'POST', path: '/api/webhooks/repurposing-status', description: 'Receive repurposing status updates' },
    { method: 'GET', path: '/api/content', description: 'List all content items' },
    { method: 'POST', path: '/api/content', description: 'Create content item' },
    { method: 'GET', path: '/api/series', description: 'List all series' },
    { method: 'GET', path: '/api/reviews', description: 'List reviews' },
    { method: 'GET', path: '/api/calendar', description: 'Calendar events' },
    { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics' },
    { method: 'GET', path: '/api/dashboard/alerts', description: 'Active alerts' },
    { method: 'GET', path: '/api/metrics', description: 'Performance metrics' },
    { method: 'GET', path: '/api/settings', description: 'System settings' },
  ],
  repurposing: [
    { method: 'POST', path: '/api/webhooks/new-content', description: 'Receive new content from Creation' },
    { method: 'GET', path: '/api/sources', description: 'List source content' },
    { method: 'GET', path: '/api/derivatives', description: 'List derivatives' },
    { method: 'GET', path: '/api/translations', description: 'List translations' },
    { method: 'GET', path: '/api/jobs', description: 'Processing job queue' },
    { method: 'GET', path: '/api/languages', description: 'Supported languages' },
    { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics' },
    { method: 'GET', path: '/api/dashboard/alerts', description: 'Active alerts' },
  ],
  distribution: [
    { method: 'POST', path: '/api/webhooks/new-content', description: 'Receive content from Repurposing' },
    { method: 'POST', path: '/api/webhooks/platform-status', description: 'Platform status updates' },
    { method: 'GET', path: '/api/content', description: 'Distribution content items' },
    { method: 'GET', path: '/api/platforms', description: 'Platform health' },
    { method: 'GET', path: '/api/rss-feeds', description: 'RSS feed management' },
    { method: 'GET', path: '/api/metrics', description: 'Distribution metrics' },
    { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics' },
    { method: 'GET', path: '/api/dashboard/alerts', description: 'Active alerts' },
  ],
  communication: [
    { method: 'POST', path: '/api/webhooks/delivery-status', description: 'Message delivery updates' },
    { method: 'GET', path: '/api/campaigns', description: 'Campaign list' },
    { method: 'GET', path: '/api/contacts', description: 'Contact management' },
    { method: 'GET', path: '/api/segments', description: 'Audience segments' },
    { method: 'GET', path: '/api/sequences', description: 'Automation sequences' },
    { method: 'GET', path: '/api/templates', description: 'Message templates' },
    { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics' },
    { method: 'GET', path: '/api/dashboard/alerts', description: 'Active alerts' },
  ],
  administration: [],
  discipling: [],
}

export default function StatusPage() {
  const { data: healthData, isLoading } = useSWR('/api/health', fetcher, { refreshInterval: 15000 })

  const pillarsHealth = healthData?.pillars || {}

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          System Status
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Health checks, response times, and endpoint directory for all pillars
        </p>
      </div>

      {/* Overall Status */}
      {healthData && (
        <div
          style={{
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            background: healthData.overall === 'healthy'
              ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
              : 'linear-gradient(135deg, #fef3c7, #fde68a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
              System: {healthData.overall === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.25rem' }}>
              {healthData.summary.up} of {healthData.summary.total} pillars online
              {healthData.summary.notBuilt > 0 && ` (${healthData.summary.notBuilt} not yet built)`}
            </div>
          </div>
          <Badge variant={healthData.overall === 'healthy' ? 'success' : 'warning'} size="lg">
            {healthData.overall.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Health Table */}
      <Card title="Pillar Health" subtitle="Real-time status of all 6 pillars">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {['Pillar', 'Status', 'Response', 'App Port', 'nginx Port', 'PM2 Name', 'URL', 'Last Checked'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        borderBottom: '2px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {PILLARS.map((p) => {
                const health = pillarsHealth[p.id]
                const isNotBuilt = !p.enabled
                const isUp = health?.status === 'up'
                const isDown = health?.status === 'down'

                return (
                  <tr
                    key={p.id}
                    style={{
                      opacity: isNotBuilt ? 0.5 : 1,
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isUp ? '#10b981' : isDown ? '#ef4444' : '#d1d5db',
                          boxShadow: isUp ? '0 0 6px #10b981' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          P{p.number} {p.name}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {isNotBuilt ? (
                        <Badge variant="neutral" size="sm">Not Built</Badge>
                      ) : isUp ? (
                        <Badge variant="success" size="sm">Online</Badge>
                      ) : isDown ? (
                        <Badge variant="error" size="sm">Offline</Badge>
                      ) : isLoading ? (
                        <Badge variant="warning" size="sm">Checking...</Badge>
                      ) : null}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {health?.responseMs != null ? `${health.responseMs}ms` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.appPort}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.nginxPort}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.pm2Name}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {p.enabled ? (
                        <a
                          href={p.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#3b82f6',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {p.externalUrl}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                      {health?.lastChecked
                        ? new Date(health.lastChecked).toLocaleTimeString()
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Endpoint Directory */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          Endpoint Directory
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {PILLARS.map((p) => {
            const endpoints = PILLAR_ENDPOINTS[p.id] || []
            return (
              <Card key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      background: p.color,
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    P{p.number}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {p.enabled ? p.externalUrl : `Reserved: port ${p.appPort}/${p.nginxPort}`}
                    </div>
                  </div>
                </div>

                {endpoints.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {endpoints.map((ep, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '6px',
                          background: '#f9fafb',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            color: ep.method === 'POST' ? '#f97316' : '#10b981',
                            width: '36px',
                          }}
                        >
                          {ep.method}
                        </span>
                        <span style={{ fontFamily: 'monospace', color: '#334155', flex: 1 }}>
                          {ep.path}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          {ep.description}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Endpoints TBD — pillar not yet built
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
