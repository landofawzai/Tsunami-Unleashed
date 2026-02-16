'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MetricsPage() {
  const [days, setDays] = useState(7)

  const { data, error } = useSWR(`/api/metrics?days=${days}`, fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading metrics</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊 Pipeline Metrics</h1>
        <p style={{ color: '#6b7280' }}>Historical distribution performance and trends</p>
      </header>

      {/* Time Range Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <Card title="Date Range">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: `1px solid ${days === d ? '#2563eb' : '#d1d5db'}`,
                  background: days === d ? '#eff6ff' : 'white',
                  color: days === d ? '#2563eb' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: days === d ? 600 : 400,
                }}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Posts" value={data.summary.totalPosts} icon="📨" color="blue" />
        <StatCard label="Successful" value={data.summary.successfulPosts} icon="✅" color="green" />
        <StatCard label="Failed" value={data.summary.failedPosts} icon="❌" color="red" />
        <StatCard
          label="Avg Success Rate"
          value={`${Math.round(data.summary.avgSuccessRate)}%`}
          icon="📈"
          color={data.summary.avgSuccessRate >= 80 ? 'green' : data.summary.avgSuccessRate >= 60 ? 'yellow' : 'red'}
        />
      </div>

      {/* Tier Breakdown */}
      <Card title="Distribution by Tier" subtitle={`Last ${days} days`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.5rem' }}>Tier 1</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0c4a6e' }}>{data.summary.tier1Posts}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#15803d', marginBottom: '0.5rem' }}>Tier 2</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#14532d' }}>{data.summary.tier2Posts}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#ca8a04', marginBottom: '0.5rem' }}>Tier 3</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#854d0e' }}>{data.summary.tier3Posts}</div>
          </div>
        </div>
      </Card>

      {/* Daily Metrics Table */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Daily Metrics" subtitle={`${data.metrics.length} days of data`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Success</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Failed</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>T1</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>T2</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>T3</th>
                </tr>
              </thead>
              <tbody>
                {data.metrics.map((metric: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(metric.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{metric.totalPosts}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>
                      {metric.successfulPosts}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444' }}>
                      {metric.failedPosts}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {Math.round(metric.successRate)}%
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{metric.tier1Posts}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{metric.tier2Posts}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{metric.tier3Posts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
