'use client'

import useSWR from 'swr'
import { PILLARS } from '@/lib/pillar-config'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/Card'
import { PillarCard } from '@/components/PillarCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function HomePage() {
  const { data: statsData } = useSWR('/api/aggregate/stats', fetcher, { refreshInterval: 30000 })
  const { data: alertsData } = useSWR('/api/aggregate/alerts', fetcher, { refreshInterval: 30000 })

  const pillars = statsData?.pillars || {}
  const summary = statsData?.summary || {}
  const alerts = alertsData?.alerts || []

  // Extract pillar-specific display metrics
  const creationData = pillars.creation?.data
  const repurposingData = pillars.repurposing?.data
  const distributionData = pillars.distribution?.data
  const communicationData = pillars.communication?.data

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1rem', }}> {/* responsive padding */}
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Tsunami Unleashed — Command Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Unified view across all 6 automation pillars
        </p>
      </div>

      {/* System Health Bar */}
      <Card title="System Health">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {PILLARS.map((p) => {
            const status = pillars[p.id]?.status
            let dotColor = '#d1d5db'
            let label = 'Loading...'
            if (!p.enabled) {
              dotColor = '#d1d5db'
              label = 'Coming Soon'
            } else if (status === 'up') {
              dotColor = '#10b981'
              label = 'Online'
            } else if (status === 'down') {
              dotColor = '#ef4444'
              label = 'Offline'
            }

            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: dotColor,
                    boxShadow: status === 'up' ? `0 0 8px ${dotColor}` : 'none',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                    P{p.number} {p.shortName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid-stats">
        <StatCard
          label="Total Content"
          value={creationData?.totalContent ?? '—'}
          color="green"
          subtitle="Pillar 1 — Creation"
        />
        <StatCard
          label="Derivatives"
          value={repurposingData?.derivatives?.total ?? '—'}
          color="orange"
          subtitle="Pillar 2 — Repurposing"
        />
        <StatCard
          label="Posts Today"
          value={distributionData?.today?.posts ?? '—'}
          color="purple"
          subtitle="Pillar 3 — Distribution"
        />
        <StatCard
          label="Messages Sent"
          value={communicationData?.today?.messagesSent ?? '—'}
          color="blue"
          subtitle="Pillar 4 — Communication"
        />
        <StatCard
          label="Pillars Online"
          value={`${summary.pillarsUp ?? 0}/${PILLARS.length}`}
          color="slate"
          subtitle={`${summary.pillarsNotBuilt ?? 0} not yet built`}
        />
        <StatCard
          label="Active Alerts"
          value={summary.totalAlerts ?? 0}
          color={summary.totalAlerts > 0 ? 'red' : 'gray'}
          subtitle="Across all pillars"
        />
      </div>

      {/* Pipeline Flow */}
      <div style={{ marginTop: '1.5rem' }}>
        <Card title="Pipeline Flow" subtitle="Content journey across all pillars">
          <div className="grid-pipeline-flow">
            <PipelineStage
              color="#10b981"
              label="Creation"
              pillar="P1"
              metrics={[
                { label: 'Total', value: creationData?.totalContent ?? '—' },
                { label: 'In Production', value: creationData?.inProduction ?? '—' },
                { label: 'Pending Review', value: creationData?.pendingReviews ?? '—' },
                { label: 'Sent', value: creationData?.totalSent ?? '—' },
              ]}
              status={pillars.creation?.status}
            />

            <PipelineStage
              color="#f97316"
              label="Repurposing"
              pillar="P2"
              metrics={[
                { label: 'Sources', value: repurposingData?.sources?.total ?? '—' },
                { label: 'Derivatives', value: repurposingData?.derivatives?.total ?? '—' },
                { label: 'Translations', value: repurposingData?.translations?.total ?? '—' },
                { label: 'Processing', value: repurposingData?.jobs?.processing ?? '—' },
              ]}
              status={pillars.repurposing?.status}
            />

            <PipelineStage
              color="#8b5cf6"
              label="Distribution"
              pillar="P3"
              metrics={[
                { label: 'Posts Today', value: distributionData?.today?.posts ?? '—' },
                {
                  label: 'Success Rate',
                  value: distributionData?.today?.successRate != null
                    ? `${distributionData.today.successRate}%`
                    : '—',
                },
                {
                  label: 'Platforms',
                  value: distributionData?.platforms
                    ? `${distributionData.platforms.healthy}/${distributionData.platforms.total}`
                    : '—',
                },
                { label: 'Active', value: distributionData?.content?.active ?? '—' },
              ]}
              status={pillars.distribution?.status}
            />

            <PipelineStage
              color="#0ea5e9"
              label="Communication"
              pillar="P4"
              metrics={[
                { label: 'Sent Today', value: communicationData?.today?.messagesSent ?? '—' },
                {
                  label: 'Delivery',
                  value: communicationData?.today?.deliveryRate != null
                    ? `${communicationData.today.deliveryRate}%`
                    : '—',
                },
                { label: 'Contacts', value: communicationData?.contacts?.active ?? '—' },
                { label: 'Campaigns', value: communicationData?.campaigns?.total ?? '—' },
              ]}
              status={pillars.communication?.status}
            />
          </div>

          <div className="grid-pipeline-arrows">
            <div style={{ fontSize: '1.25rem', color: '#d1d5db' }}>&darr;</div>
            <div style={{ fontSize: '1.25rem', color: '#d1d5db' }}>&darr;</div>
            <div style={{ fontSize: '1.25rem', color: '#d1d5db' }}>&darr;</div>
            <div style={{ fontSize: '1.25rem', color: '#d1d5db' }}>&darr;</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            Reaching 1 billion people globally through automated content delivery
          </div>
        </Card>
      </div>

      {/* Main Content: Pillar Grid + Alerts Sidebar */}
      <div className="grid-main-layout">
        {/* Pillar Summary Grid */}
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '1rem',
            }}
          >
            Pillar Overview
          </h2>
          <div className="grid-pillar-overview">
            {PILLARS.map((p) => (
              <PillarCard
                key={p.id}
                pillar={p}
                stats={pillars[p.id]}
                metrics={getPillarMetrics(p.id, pillars[p.id]?.data)}
              />
            ))}
          </div>
        </div>

        {/* Alerts Sidebar */}
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '1rem',
            }}
          >
            Cross-Pillar Alerts
          </h2>
          <Card>
            {alerts.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                {statsData ? 'No active alerts' : 'Loading alerts...'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.slice(0, 15).map((alert: Record<string, unknown>, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      borderLeft: `3px solid ${String(alert.pillarColor || '#6b7280')}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280' }}>
                        {String(alert.pillarName)}
                      </span>
                      <Badge
                        variant={
                          alert.severity === 'critical'
                            ? 'error'
                            : alert.severity === 'warning'
                              ? 'warning'
                              : 'info'
                        }
                        size="sm"
                      >
                        {String(alert.severity)}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#374151', margin: 0, lineHeight: 1.4 }}>
                      {String(alert.message)}
                    </p>
                    {typeof alert.createdAt === 'string' && (
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}

function getPillarMetrics(
  id: string,
  data: Record<string, unknown> | null | undefined
): { label: string; value: string | number }[] {
  if (!data) return []

  switch (id) {
    case 'creation':
      return [
        { label: 'Total Content', value: Number(data.totalContent ?? 0) },
        { label: 'In Production', value: Number(data.inProduction ?? 0) },
        { label: 'Pending Review', value: Number(data.pendingReviews ?? 0) },
        { label: 'Sent', value: Number(data.totalSent ?? 0) },
      ]
    case 'repurposing': {
      const sources = (data.sources || {}) as Record<string, number>
      const derivatives = (data.derivatives || {}) as Record<string, number>
      const translations = (data.translations || {}) as Record<string, number>
      const jobs = (data.jobs || {}) as Record<string, number>
      return [
        { label: 'Sources', value: sources.total ?? 0 },
        { label: 'Derivatives', value: derivatives.total ?? 0 },
        { label: 'Translations', value: translations.total ?? 0 },
        { label: 'Processing', value: jobs.processing ?? 0 },
      ]
    }
    case 'distribution': {
      const today = (data.today || {}) as Record<string, number>
      const content = (data.content || {}) as Record<string, number>
      const platforms = (data.platforms || {}) as Record<string, number>
      return [
        { label: 'Posts Today', value: today.posts ?? 0 },
        { label: 'Success Rate', value: today.successRate != null ? `${today.successRate}%` : '—' },
        { label: 'Active', value: content.active ?? 0 },
        { label: 'Platforms', value: platforms.healthy != null ? `${platforms.healthy}/${platforms.total}` : '—' },
      ]
    }
    case 'communication': {
      const today = (data.today || {}) as Record<string, number>
      const contacts = (data.contacts || {}) as Record<string, number>
      const campaigns = (data.campaigns || {}) as Record<string, number>
      return [
        { label: 'Sent Today', value: today.messagesSent ?? 0 },
        { label: 'Delivery', value: today.deliveryRate != null ? `${today.deliveryRate}%` : '—' },
        { label: 'Contacts', value: contacts.active ?? 0 },
        { label: 'Campaigns', value: campaigns.total ?? 0 },
      ]
    }
    default:
      return []
  }
}

function PipelineStage({
  color,
  label,
  pillar,
  metrics,
  status,
}: {
  color: string
  label: string
  pillar: string
  metrics: { label: string; value: string | number }[]
  status?: string
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '10px',
        border: `2px solid ${status === 'up' ? color : '#e5e7eb'}`,
        padding: '1rem',
        opacity: status === 'down' ? 0.5 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            background: color,
            color: 'white',
            padding: '0.125rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
          }}
        >
          {pillar}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>{label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {metrics.map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{m.value}</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', textTransform: 'uppercase' }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
      {status === 'down' && (
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.7rem',
            color: '#ef4444',
            fontWeight: 600,
          }}
        >
          Pillar offline
        </div>
      )}
    </div>
  )
}
