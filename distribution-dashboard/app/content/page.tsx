'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ContentPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')

  const queryParams = new URLSearchParams({
    page: page.toString(),
    ...(statusFilter && { status: statusFilter }),
    ...(tierFilter && { tier: tierFilter }),
  })

  const { data, error } = useSWR(`/api/content?${queryParams}`, fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading content</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📨 Content Items</h1>
        <p style={{ color: '#6b7280' }}>View and manage distributed content</p>
      </header>

      {/* Filters */}
      <Card title="Filters">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>
              Tier
            </label>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content List */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="Content Items"
          subtitle={`${data.pagination.total} total items • Page ${page} of ${data.pagination.totalPages}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.items.map((item: any) => (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : 'info'} size="sm">
                      {item.status}
                    </Badge>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tier {item.tier}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.platformsCompleted}/{item.platformsTargeted} platforms
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.contentType}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
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
