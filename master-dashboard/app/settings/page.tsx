'use client'

import useSWR from 'swr'
import { PILLARS, ENABLED_PILLARS, PLACEHOLDER_PILLARS } from '@/lib/pillar-config'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
  const { data: healthData } = useSWR('/api/health', fetcher, { refreshInterval: 30000 })

  const pillarsHealth = healthData?.pillars || {}

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          System configuration, pillar details, and architecture overview
        </p>
      </div>

      {/* Pillar Configuration Table */}
      <Card title="Pillar Configuration" subtitle="All 6 pillars — 4 live, 2 reserved">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {['#', 'Name', 'Status', 'App Port', 'nginx Port', 'PM2 Name', 'External URL', 'Internal URL'].map(
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

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: p.enabled ? 1 : 0.5 }}>
                    <td style={{ padding: '0.75rem' }}>
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
                        {p.number}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#111827' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {p.enabled ? (
                        <Badge variant={health?.status === 'up' ? 'success' : health?.status === 'down' ? 'error' : 'warning'} size="sm">
                          {health?.status === 'up' ? 'Live' : health?.status === 'down' ? 'Down' : 'Checking...'}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Not Built</Badge>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.appPort}</td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.nginxPort}</td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.pm2Name}</td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.enabled ? (
                        <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                          {p.externalUrl}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Reserved</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
                      localhost:{p.appPort}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Architecture Diagram */}
      <div style={{ marginTop: '1.5rem' }}>
        <Card title="System Architecture" subtitle="Tsunami Unleashed — 6-Pillar Automation System">
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              color: '#334155',
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              overflow: 'auto',
            }}
          >
{`┌─────────────────────────────────────────────────────────────────────────┐
│                    TSUNAMI UNLEASHED — COMMAND CENTER                    │
│                     Master Dashboard (port 3004/3083)                    │
│               Read-only aggregation from all pillar APIs                │
└───────┬─────────────┬─────────────┬─────────────┬───────────────────────┘
        │             │             │             │
  ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
  │ P1 CREATE │ │ P2 REPUR. │ │ P3 DISTR. │ │ P4 COMMS  │
  │ port 3003 │ │ port 3002 │ │ port 3000 │ │ port 3001 │
  │ nginx 3082│ │ nginx 3080│ │ nginx 80  │ │ nginx 3081│
  │   LIVE    │ │   LIVE    │ │   LIVE    │ │   LIVE    │
  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
        │             │             │             │
        └──────┬──────┘             └──────┬──────┘
               │                           │
     Google Drive + Pabbly          Google Drive + Pabbly
     (shared filesystem +           (shared filesystem +
      event routing)                 event routing)
               │                           │
        ┌──────┴──────┐             ┌──────┴──────┐
        │             │             │             │
  ┌ ─ ─ ▼ ─ ─ ┐ ┌ ─ ─ ▼ ─ ─ ┐     │             │
  │ P5 ADMIN  │ │ P6 DISCIP.│     │             │
  │ port 3005 │ │ port 3006 │     │             │
  │ nginx 3084│ │ nginx 3085│     │             │
  │  PLANNED  │ │  PLANNED  │     │             │
  └ ─ ─ ─ ─ ─ ┘ └ ─ ─ ─ ─ ─ ┘     │             │
                                    ▼             ▼
                              ┌───────────────────────┐
                              │    GLOBAL AUDIENCE     │
                              │  RSS · Social · Email  │
                              │  WhatsApp · Telegram   │
                              └───────────────────────┘

Integration: Pillars communicate via Google Drive (filesystem) + Pabbly Connect (events)
             No direct pillar-to-pillar API calls — ensures resilience
             Metadata sidecars (.meta.json) carry contentId through all tiers`}
          </pre>
        </Card>
      </div>

      {/* System Info */}
      <div className="grid-settings-2col">
        <Card title="System Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow label="Server" value="Hetzner VPS — 5.78.183.112" />
            <InfoRow label="OS" value="Ubuntu 24.04 LTS" />
            <InfoRow label="Node.js" value="v22.22.0" />
            <InfoRow label="Process Manager" value="PM2" />
            <InfoRow label="Reverse Proxy" value="nginx" />
            <InfoRow label="Framework" value="Next.js 14 (App Router)" />
            <InfoRow label="Database" value="Prisma + SQLite (per pillar)" />
            <InfoRow label="Master DB" value="None — pure aggregation" />
            <InfoRow label="Auto-Refresh" value="30 seconds (SWR)" />
            <InfoRow label="Total Dashboards" value={`${ENABLED_PILLARS.length} live + 1 master + ${PLACEHOLDER_PILLARS.length} planned`} />
          </div>
        </Card>

        <Card title="Port Allocation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {PILLARS.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${p.enabled ? p.color : '#d1d5db'}`,
                  opacity: p.enabled ? 1 : 0.5,
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>
                  P{p.number} {p.shortName}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                  :{p.appPort} → :{p.nginxPort}
                </span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: '#f1f5f9',
                borderRadius: '6px',
                borderLeft: '3px solid #334155',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Master Dashboard
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                :3004 → :3083
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Planned Pillars */}
      {PLACEHOLDER_PILLARS.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Card title="Planned Pillars" subtitle="Reserved ports and feature plans">
            <div className="grid-planned-pillars">
              {PLACEHOLDER_PILLARS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '1.25rem',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    borderLeft: `4px solid #d1d5db`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: '#d1d5db',
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
                      {p.number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.description}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <strong>Reserved:</strong> port {p.appPort}/{p.nginxPort} — PM2: {p.pm2Name}
                  </div>
                  {p.plannedFeatures && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                        Planned Features
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6 }}>
                        {p.plannedFeatures.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Integration Notes */}
      <div style={{ marginTop: '1.5rem' }}>
        <Card title="Integration Standard">
          <div className="grid-settings-2col" style={{ marginTop: 0 }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                Communication Layer
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.8 }}>
                <li>Google Drive — shared filesystem</li>
                <li>Pabbly Connect — event routing</li>
                <li>No direct pillar-to-pillar API calls</li>
                <li>Metadata sidecars (.meta.json)</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                Naming Convention
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.8 }}>
                <li><code>ROUTE-[source]-to-[dest]</code> — cross-pillar</li>
                <li><code>INTERNAL-[pillar]-[action]</code> — within pillar</li>
                <li>ContentId follows content through all tiers</li>
                <li>Webhook auth via <code>x-api-key</code> header</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: '#111827', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}
