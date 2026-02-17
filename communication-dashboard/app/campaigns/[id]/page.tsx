'use client'

// Campaign Detail Page
// View campaign details, versions, approval status, and delivery stats

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
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

const BROADCAST_STATUS: Record<string, { variant: 'info' | 'warning' | 'success' | 'error' | 'neutral' | 'orange'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  sending: { variant: 'orange', label: 'Sending' },
  sent: { variant: 'success', label: 'Sent' },
  partial: { variant: 'warning', label: 'Partial' },
  failed: { variant: 'error', label: 'Failed' },
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const { data: campaign, error, mutate } = useSWR(
    `/api/campaigns/${campaignId}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const [activeTab, setActiveTab] = useState('email')
  const [scheduling, setScheduling] = useState(false)
  const [segmentIds, setSegmentIds] = useState<string[]>([])
  const [scheduleChannels, setScheduleChannels] = useState<string[]>(['email'])
  const [scheduledAt, setScheduledAt] = useState('')
  const [actionError, setActionError] = useState('')

  // Load segments for scheduling
  const { data: segmentData } = useSWR('/api/dashboard/stats', fetcher)

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading campaign</h1>
        <p style={{ color: '#6b7280' }}>{error.message}</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading campaign...
      </div>
    )
  }

  if (campaign.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Campaign not found</h1>
        <button onClick={() => router.push('/campaigns')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Campaigns
        </button>
      </div>
    )
  }

  const typeBadge = TYPE_BADGES[campaign.type] || TYPE_BADGES.update
  const statusBadge = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft
  const channels = Array.from(new Set<string>((campaign.versions || []).map((v: any) => v.channel)))

  const handleApprove = async () => {
    try {
      setActionError('')
      const res = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'dashboard', action: 'approve' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      mutate()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleReject = async () => {
    try {
      setActionError('')
      const res = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      mutate()
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const handleSchedule = async () => {
    if (segmentIds.length === 0 || scheduleChannels.length === 0) {
      setActionError('Select at least one segment and one channel')
      return
    }
    try {
      setActionError('')
      const res = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentIds,
          channels: scheduleChannels,
          scheduledAt: scheduledAt || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      mutate()
      setScheduling(false)
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  const toggleSegment = (id: string) => {
    setSegmentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleScheduleChannel = (ch: string) => {
    setScheduleChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => router.push('/campaigns')} className="back-btn">
          &larr; Back to Campaigns
        </button>
        <div className="detail-title-row">
          <h1 className="detail-title">{campaign.title}</h1>
          <div className="detail-badges">
            <Badge variant={typeBadge.variant} size="md">{typeBadge.label}</Badge>
            <Badge variant={statusBadge.variant} size="md">{statusBadge.label}</Badge>
            {campaign.isUrgent && <Badge variant="error" size="md">URGENT</Badge>}
            <Badge variant="neutral" size="sm">Priority: {campaign.priority}</Badge>
          </div>
        </div>
        <div className="detail-meta">
          <span>Created: {new Date(campaign.createdAt).toLocaleString()}</span>
          {campaign.approvedBy && <span>Approved by: {campaign.approvedBy}</span>}
          {campaign.scheduledAt && <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</span>}
          {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleString()}</span>}
        </div>
      </div>

      {actionError && (
        <div className="error-banner">
          {actionError}
          <button onClick={() => setActionError('')} className="error-close">x</button>
        </div>
      )}

      <div className="detail-grid">
        {/* Left Column */}
        <div className="detail-main">
          {/* Master Message */}
          <Card title="Master Message" subtitle={`Source language: ${campaign.language}`}>
            <pre className="master-body">{campaign.body}</pre>
          </Card>

          {/* Channel Versions */}
          {campaign.versions && campaign.versions.length > 0 && (
            <Card title="Channel Versions" subtitle={`${campaign.versions.length} version(s) across ${channels.length} channel(s)`}>
              <div className="version-tabs">
                {channels.map((ch: string) => (
                  <button
                    key={ch}
                    className={`version-tab ${activeTab === ch ? 'active' : ''}`}
                    onClick={() => setActiveTab(ch)}
                  >
                    {ch.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {campaign.versions
                .filter((v: any) => v.channel === activeTab)
                .map((version: any) => (
                  <div key={version.id} className="version-item">
                    <div className="version-header">
                      <Badge variant="neutral" size="sm">{version.language}</Badge>
                      {version.isAiGenerated && <Badge variant="info" size="sm">AI Generated</Badge>}
                    </div>
                    {version.subject && (
                      <div className="version-subject"><strong>Subject:</strong> {version.subject}</div>
                    )}
                    <pre className="version-body">{version.body}</pre>
                  </div>
                ))}
            </Card>
          )}

          {/* Broadcasts */}
          {campaign.broadcasts && campaign.broadcasts.length > 0 && (
            <Card title="Broadcasts" subtitle="Delivery history">
              <div className="broadcasts-list">
                {campaign.broadcasts.map((broadcast: any) => {
                  const bStatus = BROADCAST_STATUS[broadcast.status] || BROADCAST_STATUS.pending
                  const broadcastChannels: string[] = JSON.parse(broadcast.channels || '[]')
                  return (
                    <div key={broadcast.id} className="broadcast-item">
                      <div className="broadcast-top">
                        <Badge variant={bStatus.variant} size="sm">{bStatus.label}</Badge>
                        <span className="broadcast-segment">{broadcast.segment?.name?.replace(/_/g, ' ')}</span>
                        <span className="broadcast-channels">{broadcastChannels.join(', ')}</span>
                      </div>
                      <div className="broadcast-stats">
                        <span className="stat-sent">{broadcast.delivered} delivered</span>
                        <span className="stat-failed">{broadcast.failed} failed</span>
                        <span className="stat-total">of {broadcast.totalRecipients}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <aside className="detail-sidebar">
          {/* Actions */}
          <Card title="Actions">
            <div className="action-list">
              {(campaign.status === 'draft' || campaign.status === 'pending_approval') && (
                <>
                  <button onClick={handleApprove} className="action-btn approve">
                    Approve Campaign
                  </button>
                  {campaign.status === 'pending_approval' && (
                    <button onClick={handleReject} className="action-btn reject">
                      Reject to Draft
                    </button>
                  )}
                </>
              )}

              {campaign.status === 'approved' && !scheduling && (
                <button onClick={() => setScheduling(true)} className="action-btn schedule">
                  Schedule & Send
                </button>
              )}

              {scheduling && (
                <div className="schedule-form">
                  <div className="field-group">
                    <label className="sched-label">Target Segments</label>
                    {segmentData?.segments?.map((seg: any) => (
                      <label key={seg.name} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={segmentIds.includes(seg.name)}
                          onChange={() => toggleSegment(seg.name)}
                        />
                        {seg.name.replace(/_/g, ' ')} ({seg.contactCount})
                      </label>
                    ))}
                  </div>
                  <div className="field-group">
                    <label className="sched-label">Channels</label>
                    {['email', 'sms', 'whatsapp', 'telegram', 'signal', 'social_media'].map((ch) => (
                      <label key={ch} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={scheduleChannels.includes(ch)}
                          onChange={() => toggleScheduleChannel(ch)}
                        />
                        {ch.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                  <div className="field-group">
                    <label className="sched-label">Schedule For (optional)</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="sched-input"
                    />
                  </div>
                  <button onClick={handleSchedule} className="action-btn approve">
                    Confirm & Schedule
                  </button>
                  <button onClick={() => setScheduling(false)} className="action-btn cancel">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Campaign Info */}
          <Card title="Campaign Info">
            <div className="info-list">
              <div className="info-row">
                <span className="info-key">ID</span>
                <span className="info-value">{campaign.id.substring(0, 12)}...</span>
              </div>
              <div className="info-row">
                <span className="info-key">Type</span>
                <span className="info-value">{campaign.type}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Status</span>
                <span className="info-value">{campaign.status}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Language</span>
                <span className="info-value">{campaign.language}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Versions</span>
                <span className="info-value">{campaign.versions?.length || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Broadcasts</span>
                <span className="info-value">{campaign.broadcasts?.length || 0}</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <style jsx>{`
        .detail-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .back-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.75rem;
        }
        .back-btn:hover {
          text-decoration: underline;
        }
        .detail-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }
        .detail-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .detail-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .detail-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.8125rem;
          color: #6b7280;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .error-banner {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }
        .error-close {
          background: none;
          border: none;
          color: #991b1b;
          cursor: pointer;
          font-size: 1rem;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .detail-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .master-body {
          font-size: 0.875rem;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin: 0;
          font-family: inherit;
          line-height: 1.6;
        }
        .version-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .version-tab {
          padding: 0.5rem 0.75rem;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .version-tab.active {
          background: #2563eb;
          color: white;
        }
        .version-item {
          margin-bottom: 1rem;
        }
        .version-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .version-subject {
          font-size: 0.875rem;
          color: #374151;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .version-body {
          font-size: 0.8125rem;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          margin: 0;
          font-family: inherit;
          line-height: 1.5;
        }
        .broadcasts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .broadcast-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .broadcast-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .broadcast-segment {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          text-transform: capitalize;
        }
        .broadcast-channels {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: auto;
        }
        .broadcast-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.8125rem;
        }
        .stat-sent { color: #10b981; }
        .stat-failed { color: #ef4444; }
        .stat-total { color: #6b7280; }
        .action-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .action-btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }
        .action-btn.approve {
          background: #10b981;
          color: white;
        }
        .action-btn.approve:hover { background: #059669; }
        .action-btn.reject {
          background: #ef4444;
          color: white;
        }
        .action-btn.reject:hover { background: #dc2626; }
        .action-btn.schedule {
          background: #2563eb;
          color: white;
        }
        .action-btn.schedule:hover { background: #1d4ed8; }
        .action-btn.cancel {
          background: #f3f4f6;
          color: #374151;
        }
        .action-btn.cancel:hover { background: #e5e7eb; }
        .schedule-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .sched-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #374151;
          text-transform: capitalize;
          cursor: pointer;
          padding: 0.125rem 0;
        }
        .sched-input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8125rem;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.375rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child { border-bottom: none; }
        .info-key {
          font-size: 0.8125rem;
          color: #6b7280;
        }
        .info-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
        }
        @media (max-width: 1024px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
