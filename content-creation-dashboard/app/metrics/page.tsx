// Metrics Page
// Production velocity, type breakdown, review turnaround, pipeline status

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MetricsPage() {
  const [days, setDays] = useState(30)

  const { data, error } = useSWR(`/api/metrics?days=${days}`, fetcher, {
    refreshInterval: 30000,
  })

  const { data: stats } = useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 30000,
  })

  if (error) {
    return (
      <div className="metrics-page">
        <p className="error-text">Failed to load metrics</p>
        <style jsx>{`.metrics-page { padding: 2rem; } .error-text { color: #991b1b; text-align: center; }`}</style>
      </div>
    )
  }

  const metrics = data?.metrics || []
  const totals = data?.totals || {}
  const statusBreakdown = stats?.statusBreakdown || {}
  const typeBreakdown = stats?.typeBreakdown || {}
  const mediaBreakdown = stats?.mediaBreakdown || {}

  // Find max value for chart scaling
  const chartValues = metrics.map((m: any) =>
    Math.max(m.contentPlanned, m.contentDrafted, m.contentFinalized, m.contentSent, m.tasksCompleted, 1)
  )
  const maxVal = Math.max(...chartValues, 1)

  return (
    <div className="metrics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metrics</h1>
          <p className="page-subtitle">Production analytics & velocity tracking</p>
        </div>
        <div className="period-select">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="stats-grid">
        <StatCard label="Content Planned" value={totals.contentPlanned || 0} color="blue" subtitle={`Last ${days} days`} />
        <StatCard label="Content Drafted" value={totals.contentDrafted || 0} color="yellow" subtitle={`Last ${days} days`} />
        <StatCard label="Content Finalized" value={totals.contentFinalized || 0} color="green" subtitle={`Last ${days} days`} />
        <StatCard label="Sent to Repurposing" value={totals.contentSent || 0} color="teal" subtitle={`Last ${days} days`} />
        <StatCard label="Reviews Completed" value={totals.reviewsCompleted || 0} color="gray" subtitle={`Last ${days} days`} />
        <StatCard label="Tasks Completed" value={totals.tasksCompleted || 0} color="green" subtitle={`Last ${days} days`} />
      </div>

      {/* Production Velocity Chart */}
      <Card title="Production Velocity" subtitle={`Daily activity over ${days} days`}>
        {!data ? (
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        ) : metrics.length === 0 ? (
          <p className="empty-text">No metrics data yet. Metrics are generated as content moves through the pipeline.</p>
        ) : (
          <div className="chart">
            <div className="chart-legend">
              <span className="legend-item"><span className="dot" style={{ background: '#3b82f6' }} /> Planned</span>
              <span className="legend-item"><span className="dot" style={{ background: '#f59e0b' }} /> Drafted</span>
              <span className="legend-item"><span className="dot" style={{ background: '#10b981' }} /> Finalized</span>
              <span className="legend-item"><span className="dot" style={{ background: '#14b8a6' }} /> Sent</span>
            </div>
            <div className="chart-bars">
              {metrics.map((m: any) => {
                const dateStr = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div key={m.id} className="chart-col">
                    <div className="bars">
                      <div className="bar" style={{ height: `${(m.contentPlanned / maxVal) * 100}%`, background: '#3b82f6' }} title={`Planned: ${m.contentPlanned}`} />
                      <div className="bar" style={{ height: `${(m.contentDrafted / maxVal) * 100}%`, background: '#f59e0b' }} title={`Drafted: ${m.contentDrafted}`} />
                      <div className="bar" style={{ height: `${(m.contentFinalized / maxVal) * 100}%`, background: '#10b981' }} title={`Finalized: ${m.contentFinalized}`} />
                      <div className="bar" style={{ height: `${(m.contentSent / maxVal) * 100}%`, background: '#14b8a6' }} title={`Sent: ${m.contentSent}`} />
                    </div>
                    <span className="chart-date">{dateStr}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Breakdowns */}
      <div className="breakdown-grid">
        {/* Status Breakdown */}
        <Card title="Pipeline Status">
          {stats ? (
            <div className="breakdown-list">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-label">{status}</span>
                  <div className="breakdown-bar-wrap">
                    <div
                      className="breakdown-bar"
                      style={{ width: `${stats.totalContent > 0 ? ((count as number) / stats.totalContent) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{count as number}</span>
                </div>
              ))}
              {Object.keys(statusBreakdown).length === 0 && <p className="empty-text">No data</p>}
            </div>
          ) : (
            <div className="loading"><div className="spinner" /></div>
          )}
        </Card>

        {/* Type Breakdown */}
        <Card title="Content Types">
          {stats ? (
            <div className="breakdown-list">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <div key={type} className="breakdown-item">
                  <span className="breakdown-label">{type}</span>
                  <div className="breakdown-bar-wrap">
                    <div
                      className="breakdown-bar type-bar"
                      style={{ width: `${stats.totalContent > 0 ? ((count as number) / stats.totalContent) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{count as number}</span>
                </div>
              ))}
              {Object.keys(typeBreakdown).length === 0 && <p className="empty-text">No data</p>}
            </div>
          ) : (
            <div className="loading"><div className="spinner" /></div>
          )}
        </Card>

        {/* Media Breakdown */}
        <Card title="Media Types">
          {stats ? (
            <div className="breakdown-list">
              {Object.entries(mediaBreakdown).map(([media, count]) => (
                <div key={media} className="breakdown-item">
                  <span className="breakdown-label">{media}</span>
                  <div className="breakdown-bar-wrap">
                    <div
                      className="breakdown-bar media-bar"
                      style={{ width: `${stats.totalContent > 0 ? ((count as number) / stats.totalContent) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{count as number}</span>
                </div>
              ))}
              {Object.keys(mediaBreakdown).length === 0 && <p className="empty-text">No data</p>}
            </div>
          ) : (
            <div className="loading"><div className="spinner" /></div>
          )}
        </Card>
      </div>

      <style jsx>{`
        .metrics-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }
        .period-select select {
          padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; background: white; color: #111827;
        }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }

        /* Chart */
        .chart-legend { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .legend-item { font-size: 0.8rem; color: #374151; display: flex; align-items: center; gap: 0.375rem; }
        .dot { width: 10px; height: 10px; border-radius: 2px; }
        .chart-bars { display: flex; gap: 2px; align-items: flex-end; height: 200px; overflow-x: auto; }
        .chart-col { display: flex; flex-direction: column; align-items: center; min-width: 40px; flex: 1; }
        .bars { display: flex; gap: 1px; align-items: flex-end; height: 180px; width: 100%; }
        .bar { flex: 1; min-height: 2px; border-radius: 2px 2px 0 0; transition: height 0.3s; }
        .chart-date { font-size: 0.6rem; color: #9ca3af; margin-top: 0.25rem; writing-mode: vertical-lr; transform: rotate(180deg); }

        /* Breakdowns */
        .breakdown-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .breakdown-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .breakdown-item { display: grid; grid-template-columns: 80px 1fr 35px; align-items: center; gap: 0.5rem; }
        .breakdown-label { font-size: 0.8rem; color: #374151; text-transform: capitalize; }
        .breakdown-bar-wrap { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
        .breakdown-bar { height: 100%; background: linear-gradient(90deg, #10b981, #047857); border-radius: 4px; min-width: 2px; }
        .breakdown-bar.type-bar { background: linear-gradient(90deg, #3b82f6, #1e40af); }
        .breakdown-bar.media-bar { background: linear-gradient(90deg, #8b5cf6, #6d28d9); }
        .breakdown-count { font-size: 0.8rem; font-weight: 700; color: #111827; text-align: right; }

        .error-text { color: #991b1b; text-align: center; }
        .empty-text { color: #9ca3af; text-align: center; margin: 0; font-size: 0.85rem; }
        .loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #6b7280; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) { .breakdown-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .metrics-page { padding: 1rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  )
}
