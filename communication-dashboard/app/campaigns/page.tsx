'use client'

// Campaign List Page
// Browse, filter, and manage all campaigns

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const TYPE_BADGES: Record<string, { variant: 'info' | 'purple' | 'error' | 'orange' | 'success'; label: string }> = {
  update: { variant: 'info', label: 'Update' },
  prayer: { variant: 'purple', label: 'Prayer' },
  urgent: { variant: 'error', label: 'Urgent' },
  field_notice: { variant: 'orange', label: 'Field Notice' },
  announcement: { variant: 'success', label: 'Announcement' },
  sequence_step: { variant: 'info', label: 'Sequence' },
}

const STATUS_BADGES: Record<string, { variant: 'info' | 'warning' | 'success' | 'error' | 'neutral' | 'orange'; label: string }> = {
  draft: { variant: 'neutral', label: 'Draft' },
  pending_approval: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'info', label: 'Approved' },
  scheduled: { variant: 'info', label: 'Scheduled' },
  sending: { variant: 'orange', label: 'Sending' },
  sent: { variant: 'success', label: 'Sent' },
  failed: { variant: 'error', label: 'Failed' },
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)
  if (typeFilter) params.set('type', typeFilter)

  const { data, error } = useSWR(
    `/api/campaigns?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading campaigns</h1>
        <p style={{ color: '#6b7280' }}>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="campaigns-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create and manage outbound communications</p>
        </div>
        <Link href="/campaigns/new" className="new-btn">
          + New Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="update">Update</option>
          <option value="prayer">Prayer</option>
          <option value="urgent">Urgent</option>
          <option value="field_notice">Field Notice</option>
          <option value="announcement">Announcement</option>
        </select>
        {data && (
          <span className="result-count">{data.total} campaign{data.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Campaign List */}
      {!data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading campaigns...
        </div>
      ) : data.campaigns.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No campaigns found</p>
            <p>Create your first campaign to start communicating.</p>
          </div>
        </Card>
      ) : (
        <div className="campaign-list">
          {data.campaigns.map((campaign: any) => {
            const typeBadge = TYPE_BADGES[campaign.type] || TYPE_BADGES.update
            const statusBadge = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="campaign-card-link"
              >
                <Card>
                  <div className="campaign-card">
                    <div className="campaign-top">
                      <h3 className="campaign-title">{campaign.title}</h3>
                      <div className="campaign-badges">
                        <Badge variant={typeBadge.variant} size="sm">{typeBadge.label}</Badge>
                        <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                        {campaign.isUrgent && <Badge variant="error" size="sm">URGENT</Badge>}
                      </div>
                    </div>
                    <p className="campaign-body">{campaign.body.substring(0, 150)}{campaign.body.length > 150 ? '...' : ''}</p>
                    <div className="campaign-meta">
                      <span>{campaign._count.versions} version{campaign._count.versions !== 1 ? 's' : ''}</span>
                      <span>{campaign._count.broadcasts} broadcast{campaign._count.broadcasts !== 1 ? 's' : ''}</span>
                      <span className="campaign-date">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .campaigns-page {
          padding: 2rem;
          max-width: 1200px;
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
        .new-btn {
          background: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: background 0.2s;
        }
        .new-btn:hover {
          background: #1d4ed8;
        }
        .filters {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #374151;
          background: white;
        }
        .result-count {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: auto;
        }
        .campaign-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .campaign-card-link {
          text-decoration: none;
          color: inherit;
        }
        .campaign-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .campaign-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .campaign-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .campaign-badges {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .campaign-body {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        .campaign-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .campaign-date {
          margin-left: auto;
        }
        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .filters {
            flex-wrap: wrap;
          }
          .campaign-top {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
