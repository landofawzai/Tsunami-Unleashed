'use client'

// Metrics Page — Analytics dashboard with charts and breakdowns

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DERIVATIVE_LABELS: Record<string, string> = {
  blog_post: 'Blog Post',
  social_quote: 'Social Quote',
  thread_summary: 'Thread Summary',
  study_guide: 'Study Guide',
  newsletter_excerpt: 'Newsletter',
  audio_transcription: 'Transcription',
  video_clip_meta: 'Video Clip',
  quote_graphic: 'Quote Graphic',
}

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  mai: 'Maithili',
}

export default function MetricsPage() {
  const [days, setDays] = useState('30')

  const { data } = useSWR(`/api/metrics?days=${days}`, fetcher, {
    refreshInterval: 30000,
  })

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading metrics...</p>
      </div>
    )
  }

  const maxDerivatives = Math.max(...data.metrics.map((m: any) => m.derivativesGenerated), 1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metrics</h1>
          <p className="page-subtitle">
            Repurposing analytics — {data.period.days} day window
          </p>
        </div>
        <select value={days} onChange={(e) => setDays(e.target.value)} className="period-select">
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <StatCard label="Sources Ingested" value={data.totals.sourcesIngested} icon="📄" color="blue" />
        <StatCard label="Derivatives Generated" value={data.totals.derivativesGenerated} icon="🔄" color="green" />
        <StatCard label="Translations Completed" value={data.totals.translationsCompleted} icon="🌐" color="purple" />
        <StatCard label="Sent to Distribution" value={data.totals.sentToDistribution} icon="📤" color="orange" />
        <StatCard label="Jobs Processed" value={data.totals.jobsProcessed} icon="⚡" color="blue" />
        <StatCard label="Jobs Failed" value={data.totals.jobsFailed} icon="❌" color={data.totals.jobsFailed > 0 ? 'red' : 'gray'} />
      </div>

      <div className="metrics-grid">
        {/* Daily Activity Chart (bar chart via CSS) */}
        <Card title="Daily Derivatives" subtitle="Derivatives generated per day">
          <div className="chart-container">
            {data.metrics.length === 0 ? (
              <p className="empty-text">No data for this period</p>
            ) : (
              <div className="bar-chart">
                {data.metrics.map((m: any) => (
                  <div key={m.id} className="bar-col">
                    <div className="bar-value">{m.derivativesGenerated}</div>
                    <div
                      className="bar"
                      style={{ height: `${(m.derivativesGenerated / maxDerivatives) * 150}px` }}
                    />
                    <div className="bar-label">
                      {new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* AI & Scribe Usage */}
        <Card title="AI & Scribe Usage" subtitle="Resource consumption">
          <div className="usage-grid">
            <div className="usage-item">
              <span className="usage-label">AI Tokens Used</span>
              <span className="usage-value">{data.totals.aiTokensUsed.toLocaleString()}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Scribe Minutes</span>
              <span className="usage-value">{data.totals.scribeMinutes.toFixed(1)}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Images Generated</span>
              <span className="usage-value">{data.totals.imagesGenerated}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Est. AI Cost</span>
              <span className="usage-value">${((data.totals.aiTokensUsed / 1000000) * 0.25).toFixed(2)}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Est. Scribe Cost</span>
              <span className="usage-value">${(data.totals.scribeMinutes * 0.007).toFixed(2)}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Est. Image Cost</span>
              <span className="usage-value">${(data.totals.imagesGenerated * 0.03).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Language Breakdown */}
        <Card title="Language Breakdown" subtitle="Translation volume by language">
          <div className="breakdown-list">
            {Object.entries(LANG_NAMES).map(([code, name]) => {
              const count = (data.languageBreakdown as any)[code] || 0
              const total = data.realtime.totalTranslations || 1
              const pct = ((count / total) * 100).toFixed(0)
              return (
                <div key={code} className="breakdown-item">
                  <div className="breakdown-header">
                    <span className="breakdown-name">{name} ({code.toUpperCase()})</span>
                    <span className="breakdown-count">{count}</span>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Derivative Type Breakdown */}
        <Card title="Derivative Types" subtitle="Content pieces by type">
          <div className="breakdown-list">
            {Object.entries(DERIVATIVE_LABELS).map(([type, label]) => {
              const count = (data.derivativeBreakdown as any)[type] || 0
              return (
                <div key={type} className="breakdown-item">
                  <div className="breakdown-header">
                    <span className="breakdown-name">{label}</span>
                    <Badge variant="neutral" size="sm">{count}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Real-time Counts */}
        <Card title="Real-time Database" subtitle="Current totals">
          <div className="usage-grid">
            <div className="usage-item">
              <span className="usage-label">Total Sources</span>
              <span className="usage-value big">{data.realtime.totalSources}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Total Derivatives</span>
              <span className="usage-value big">{data.realtime.totalDerivatives}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Total Translations</span>
              <span className="usage-value big">{data.realtime.totalTranslations}</span>
            </div>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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
        .period-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        /* Bar Chart */
        .chart-container {
          overflow-x: auto;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          min-height: 200px;
          padding-top: 1rem;
        }
        .bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 30px;
        }
        .bar-value {
          font-size: 0.625rem;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(to top, #f97316, #fb923c);
          border-radius: 4px 4px 0 0;
          min-height: 2px;
          transition: height 0.3s;
        }
        .bar-label {
          font-size: 0.625rem;
          color: #9ca3af;
          margin-top: 4px;
          text-align: center;
          white-space: nowrap;
        }

        /* Usage Grid */
        .usage-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .usage-item {
          text-align: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .usage-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .usage-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .usage-value.big {
          font-size: 1.75rem;
        }

        /* Breakdown */
        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .breakdown-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .breakdown-name {
          font-size: 0.875rem;
          color: #374151;
        }
        .breakdown-count {
          font-size: 0.875rem;
          font-weight: 700;
          color: #111827;
        }
        .breakdown-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        .breakdown-fill {
          height: 100%;
          background: #8b5cf6;
          border-radius: 3px;
          transition: width 0.3s;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .metrics-grid { grid-template-columns: 1fr; }
          .usage-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
