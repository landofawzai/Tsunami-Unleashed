'use client'

import useSWR from 'swr'
import { PILLARS, ENABLED_PILLARS } from '@/lib/pillar-config'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StageConfig {
  id: string
  pillar: string
  pillarNumber: number
  color: string
  label: string
  description: string
  getMetrics: (data: Record<string, unknown> | null) => { label: string; value: string | number }[]
  getCount: (data: Record<string, unknown> | null) => number
}

const STAGES: StageConfig[] = [
  {
    id: 'planning',
    pillar: 'creation',
    pillarNumber: 1,
    color: '#10b981',
    label: 'Planning',
    description: 'Content ideation, briefs, and assignment',
    getMetrics: (d) => {
      const sb = (d?.statusBreakdown || {}) as Record<string, number>
      return [
        { label: 'Planning', value: sb.planning ?? 0 },
        { label: 'Series', value: Number(d?.totalSeries ?? 0) },
        { label: 'Pending Tasks', value: Number(d?.pendingTasks ?? 0) },
      ]
    },
    getCount: (d) => {
      const sb = (d?.statusBreakdown || {}) as Record<string, number>
      return sb.planning ?? 0
    },
  },
  {
    id: 'production',
    pillar: 'creation',
    pillarNumber: 1,
    color: '#10b981',
    label: 'Production',
    description: 'Drafting, recording, and editing',
    getMetrics: (d) => {
      const sb = (d?.statusBreakdown || {}) as Record<string, number>
      return [
        { label: 'Drafting', value: sb.drafting ?? 0 },
        { label: 'Recording', value: sb.recording ?? 0 },
        { label: 'Editing', value: sb.editing ?? 0 },
      ]
    },
    getCount: (d) => Number(d?.inProduction ?? 0),
  },
  {
    id: 'review',
    pillar: 'creation',
    pillarNumber: 1,
    color: '#10b981',
    label: 'Review',
    description: 'Quality review and approval',
    getMetrics: (d) => [
      { label: 'Pending Review', value: Number(d?.pendingReviews ?? 0) },
      { label: 'Overdue Tasks', value: Number(d?.overdueTasks ?? 0) },
    ],
    getCount: (d) => Number(d?.pendingReviews ?? 0),
  },
  {
    id: 'repurposing',
    pillar: 'repurposing',
    pillarNumber: 2,
    color: '#f97316',
    label: 'Repurposing',
    description: 'Transform source content into derivatives and translations',
    getMetrics: (d) => {
      const sources = (d?.sources || {}) as Record<string, number>
      const derivatives = (d?.derivatives || {}) as Record<string, number>
      const translations = (d?.translations || {}) as Record<string, number>
      return [
        { label: 'Sources', value: sources.total ?? 0 },
        { label: 'Derivatives', value: derivatives.total ?? 0 },
        { label: 'Translations', value: translations.total ?? 0 },
        { label: 'Processing', value: ((d?.jobs || {}) as Record<string, number>).processing ?? 0 },
      ]
    },
    getCount: (d) => ((d?.sources || {}) as Record<string, number>).total ?? 0,
  },
  {
    id: 'translation',
    pillar: 'repurposing',
    pillarNumber: 2,
    color: '#f97316',
    label: 'Translation',
    description: 'Multi-language translation pipeline',
    getMetrics: (d) => {
      const translations = (d?.translations || {}) as Record<string, unknown>
      const byStatus = (translations.byStatus || {}) as Record<string, number>
      const languages = Array.isArray(d?.languages) ? d.languages : []
      return [
        { label: 'Total', value: Number(translations.total ?? 0) },
        { label: 'Pending Review', value: Number(translations.pendingReviews ?? 0) },
        { label: 'Languages', value: languages.length },
        { label: 'Completed', value: byStatus.completed ?? byStatus.approved ?? 0 },
      ]
    },
    getCount: (d) => ((d?.translations || {}) as Record<string, number>).total ?? 0,
  },
  {
    id: 'distribution',
    pillar: 'distribution',
    pillarNumber: 3,
    color: '#8b5cf6',
    label: 'Distribution',
    description: '4-tier distribution across platforms',
    getMetrics: (d) => {
      const today = (d?.today || {}) as Record<string, number>
      const content = (d?.content || {}) as Record<string, number>
      const platforms = (d?.platforms || {}) as Record<string, number>
      return [
        { label: 'Posts Today', value: today.posts ?? 0 },
        { label: 'Success Rate', value: today.successRate != null ? `${today.successRate}%` : '—' },
        { label: 'Active Content', value: content.active ?? 0 },
        { label: 'Platforms Healthy', value: platforms.healthy != null && platforms.total != null ? `${platforms.healthy}/${platforms.total}` : '—' },
      ]
    },
    getCount: (d) => ((d?.today || {}) as Record<string, number>).posts ?? 0,
  },
  {
    id: 'communication',
    pillar: 'communication',
    pillarNumber: 4,
    color: '#0ea5e9',
    label: 'Communication',
    description: 'Message delivery and campaign execution',
    getMetrics: (d) => {
      const today = (d?.today || {}) as Record<string, number>
      const contacts = (d?.contacts || {}) as Record<string, number>
      const campaigns = (d?.campaigns || {}) as Record<string, number>
      return [
        { label: 'Sent Today', value: today.messagesSent ?? 0 },
        { label: 'Delivery Rate', value: today.deliveryRate != null ? `${today.deliveryRate}%` : '—' },
        { label: 'Active Contacts', value: contacts.active ?? 0 },
        { label: 'Campaigns', value: campaigns.total ?? 0 },
      ]
    },
    getCount: (d) => ((d?.today || {}) as Record<string, number>).messagesSent ?? 0,
  },
]

export default function PipelinePage() {
  const { data: statsData } = useSWR('/api/aggregate/stats', fetcher, { refreshInterval: 30000 })

  const pillars = statsData?.pillars || {}

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Pipeline Flow
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Content journey from idea to audience — across all 4 live pillars
        </p>
      </div>

      {/* Pipeline stages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {STAGES.map((stage, idx) => {
          const pillarData = pillars[stage.pillar]?.data
          const pillarStatus = pillars[stage.pillar]?.status
          const metrics = stage.getMetrics(pillarData)
          const count = stage.getCount(pillarData)
          const isDown = pillarStatus === 'down'

          return (
            <div key={stage.id}>
              {/* Connector arrow (except first) */}
              {idx > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0.25rem 0',
                  }}
                >
                  <div
                    style={{
                      width: '2px',
                      height: '24px',
                      background: stage.color === STAGES[idx - 1].color ? stage.color : `linear-gradient(${STAGES[idx - 1].color}, ${stage.color})`,
                    }}
                  />
                </div>
              )}

              {/* Stage card */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  opacity: isDown ? 0.5 : 1,
                }}
              >
                {/* Left: Stage number + color line */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '48px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: stage.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {idx + 1}
                  </div>
                </div>

                {/* Right: Stage content */}
                <div style={{ flex: 1 }}>
                  <Card>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                            {stage.label}
                          </h3>
                          <Badge variant={isDown ? 'error' : 'neutral'} size="sm">
                            P{stage.pillarNumber}
                          </Badge>
                          {isDown && (
                            <Badge variant="error" size="sm">Offline</Badge>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                          {stage.description}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: stage.color,
                        }}
                      >
                        {pillarData ? count : '—'}
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
                        gap: '0.5rem',
                      }}
                    >
                      {metrics.map((m, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.5rem',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                            {pillarData ? m.value : '—'}
                          </div>
                          <div
                            style={{
                              fontSize: '0.625rem',
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginTop: '0.125rem',
                            }}
                          >
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {pillarData && count > 0 && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          height: '4px',
                          background: '#f3f4f6',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(count * 10, 100)}%`,
                            background: stage.color,
                            borderRadius: '2px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )
        })}

        {/* Final destination */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
          <div style={{ width: '2px', height: '24px', background: '#0ea5e9' }} />
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #334155, #0f172a)',
            borderRadius: '12px',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Global Audience
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Reaching 1 billion people through automated content delivery
          </div>
        </div>
      </div>

      {/* Pillar Legend */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Pillar Legend">
          <div className="grid-legend">
            {ENABLED_PILLARS.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: p.color,
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                  P{p.number} — {p.name}
                </span>
              </div>
            ))}
            {PILLARS.filter((p) => !p.enabled).map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#d1d5db',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  P{p.number} — {p.name} (Coming Soon)
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
