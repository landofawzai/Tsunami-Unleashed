'use client'

// Communication Metrics Page
// Analytics dashboard with date range filtering

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MetricsPage() {
  const [days, setDays] = useState(30)

  const { data, error } = useSWR(`/api/metrics?days=${days}`, fetcher, {
    refreshInterval: 30000,
  })

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading metrics</h1>
      </div>
    )
  }

  return (
    <div className="metrics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Communication Metrics</h1>
          <p className="page-subtitle">Performance analytics across all channels</p>
        </div>
        <div className="period-selector">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              className={`period-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading metrics...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard
              label="Total Sent"
              value={data.totals.messagesSent}
              icon="📨"
              color="blue"
            />
            <StatCard
              label="Delivery Rate"
              value={`${data.totals.deliveryRate.toFixed(1)}%`}
              icon="📬"
              color={data.totals.deliveryRate >= 90 ? 'green' : data.totals.deliveryRate >= 70 ? 'yellow' : 'red'}
            />
            <StatCard
              label="Open Rate"
              value={`${data.totals.openRate.toFixed(1)}%`}
              icon="👁️"
              color={data.totals.openRate >= 30 ? 'green' : data.totals.openRate >= 15 ? 'yellow' : 'gray'}
            />
            <StatCard
              label="Campaigns Sent"
              value={data.totals.campaignsSent}
              icon="📋"
              color="purple"
            />
            <StatCard
              label="Urgent Alerts"
              value={data.totals.urgentAlertsSent}
              icon="🚨"
              color={data.totals.urgentAlertsSent > 0 ? 'red' : 'gray'}
            />
            <StatCard
              label="Prayer Requests"
              value={data.totals.prayerRequestsSent}
              icon="🙏"
              color="purple"
            />
          </div>

          <div className="metrics-grid">
            {/* Channel Performance */}
            <Card title="Channel Performance" subtitle={`Last ${days} days`}>
              {Object.keys(data.channelPerformance || {}).length === 0 ? (
                <p className="empty">No channel data yet</p>
              ) : (
                <div className="perf-table">
                  <div className="perf-header">
                    <span>Channel</span>
                    <span>Sent</span>
                    <span>Delivered</span>
                    <span>Failed</span>
                    <span>Opened</span>
                    <span>Rate</span>
                  </div>
                  {Object.entries(data.channelPerformance).map(([ch, stats]: [string, any]) => {
                    const total = stats.sent + stats.delivered + stats.failed + stats.opened
                    const rate = total > 0 ? ((stats.delivered + stats.opened) / total * 100).toFixed(0) : '0'
                    return (
                      <div key={ch} className="perf-row">
                        <span className="ch-name">{ch.replace('_', ' ')}</span>
                        <span>{stats.sent}</span>
                        <span className="val-delivered">{stats.delivered}</span>
                        <span className="val-failed">{stats.failed}</span>
                        <span>{stats.opened}</span>
                        <span>
                          <Badge
                            variant={parseInt(rate) >= 80 ? 'success' : parseInt(rate) >= 50 ? 'warning' : 'error'}
                            size="sm"
                          >
                            {rate}%
                          </Badge>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Region Breakdown */}
            <Card title="Region Breakdown">
              {Object.keys(data.regionBreakdown || {}).length === 0 ? (
                <p className="empty">No region data yet</p>
              ) : (
                <div className="region-list">
                  {Object.entries(data.regionBreakdown)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .map(([region, count]: [string, any]) => (
                      <div key={region} className="region-item">
                        <span className="region-name">{region}</span>
                        <span className="region-count">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Daily Trend */}
            <Card title="Daily Messages" subtitle={`Last ${days} days`}>
              {data.dailyMetrics.length === 0 ? (
                <p className="empty">No daily data yet</p>
              ) : (
                <div className="daily-chart">
                  {data.dailyMetrics.map((m: any) => {
                    const max = Math.max(...data.dailyMetrics.map((d: any) => d.messagesSent), 1)
                    const pct = (m.messagesSent / max) * 100
                    return (
                      <div key={m.id} className="daily-bar-row">
                        <span className="daily-date">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <div className="daily-bar-bg">
                          <div className="daily-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="daily-count">{m.messagesSent}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Failure Analysis */}
            <Card title="Top Failure Reasons">
              {data.topFailures.length === 0 ? (
                <p className="empty">No failures recorded</p>
              ) : (
                <div className="failure-list">
                  {data.topFailures.map((f: any, i: number) => (
                    <div key={i} className="failure-item">
                      <span className="failure-reason">{f.reason}</span>
                      <Badge variant="error" size="sm">{f.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <style jsx>{`
        .metrics-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        .period-selector {
          display: flex;
          gap: 0.25rem;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 0.25rem;
        }
        .period-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .period-btn.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .empty {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem;
        }
        .perf-table {
          font-size: 0.8125rem;
        }
        .perf-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #6b7280;
        }
        .perf-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
          color: #374151;
        }
        .ch-name { text-transform: capitalize; font-weight: 500; }
        .val-delivered { color: #10b981; font-weight: 600; }
        .val-failed { color: #ef4444; font-weight: 600; }
        .region-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .region-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        .region-name {
          font-size: 0.875rem;
          color: #374151;
        }
        .region-count {
          font-size: 0.875rem;
          font-weight: 700;
          color: #2563eb;
        }
        .daily-chart {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .daily-bar-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .daily-date {
          font-size: 0.75rem;
          color: #6b7280;
          min-width: 55px;
          text-align: right;
        }
        .daily-bar-bg {
          flex: 1;
          height: 16px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }
        .daily-bar-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .daily-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          min-width: 30px;
        }
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
          flex: 1;
        }
        @media (max-width: 1024px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
