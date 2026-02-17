'use client'

// Communication Dashboard Home Page
// Real-time overview with 30-second auto-refresh

import useSWR from 'swr'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const TYPE_BADGES: Record<string, { variant: 'info' | 'purple' | 'error' | 'orange' | 'success'; label: string }> = {
  update: { variant: 'info', label: 'Update' },
  prayer: { variant: 'purple', label: 'Prayer' },
  urgent: { variant: 'error', label: 'Urgent' },
  field_notice: { variant: 'orange', label: 'Field Notice' },
  announcement: { variant: 'success', label: 'Announcement' },
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

export default function Home() {
  const { data: stats, error: statsError } = useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 30000,
  })

  const { data: alerts } = useSWR('/api/dashboard/alerts', fetcher, {
    refreshInterval: 30000,
  })

  if (statsError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading dashboard</h1>
        <p style={{ color: '#6b7280' }}>{statsError.message}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading dashboard...</p>
        <style jsx>{`
          .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #2563eb;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="title">Communication Hub</h1>
            <p className="subtitle">Tsunami Unleashed - Outbound Multi-Channel Messaging</p>
          </div>
          <div className="header-badge">
            <Badge variant="info" size="sm">Auto-refresh: 30s</Badge>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Stats */}
        <div className="stats-column">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard
              label="Messages Sent Today"
              value={stats.today.messagesSent}
              icon="📨"
              color="blue"
            />
            <StatCard
              label="Delivery Rate"
              value={`${stats.today.deliveryRate.toFixed(1)}%`}
              icon="📬"
              color={stats.today.deliveryRate >= 90 ? 'green' : stats.today.deliveryRate >= 70 ? 'yellow' : 'red'}
            />
            <StatCard
              label="Active Contacts"
              value={stats.contacts.active}
              icon="👥"
              color="green"
            />
            <StatCard
              label="Active Sequences"
              value={stats.sequences.active}
              icon="🔄"
              color="purple"
            />
            <StatCard
              label="Open Campaigns"
              value={stats.campaigns.draft + stats.campaigns.pending + stats.campaigns.scheduled}
              icon="📋"
              color="orange"
            />
            <StatCard
              label="Unread Alerts"
              value={stats.alerts.unread}
              icon="🔔"
              color={stats.alerts.critical > 0 ? 'red' : stats.alerts.unread > 0 ? 'yellow' : 'gray'}
            />
          </div>

          {/* Recent Campaigns */}
          <Card title="Recent Campaigns" subtitle="Latest communication efforts">
            <div className="campaigns-list">
              {stats.recentCampaigns.length === 0 ? (
                <p className="empty-text">No campaigns yet. Create your first campaign to get started.</p>
              ) : (
                stats.recentCampaigns.map((campaign: any) => {
                  const typeBadge = TYPE_BADGES[campaign.type] || TYPE_BADGES.update
                  const statusBadge = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft
                  return (
                    <div key={campaign.id} className="campaign-item">
                      <div className="campaign-info">
                        <span className="campaign-title">{campaign.title}</span>
                        <div className="campaign-badges">
                          <Badge variant={typeBadge.variant} size="sm">{typeBadge.label}</Badge>
                          <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                          {campaign.isUrgent && <Badge variant="error" size="sm">URGENT</Badge>}
                        </div>
                      </div>
                      <span className="campaign-date">
                        {new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Alerts */}
          {alerts && alerts.total > 0 && (
            <Card title="Recent Alerts" subtitle={`${alerts.total} unread`}>
              <div className="alerts-list">
                {alerts.alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="alert-item">
                    <Badge
                      variant={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {alert.severity}
                    </Badge>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <aside className="sidebar">
          {/* Delivery Health */}
          <Card title="Today's Delivery" subtitle="Message status breakdown">
            <div className="delivery-grid">
              <div className="delivery-item">
                <div className="delivery-count sent">{stats.today.messagesSent}</div>
                <div className="delivery-label">Sent</div>
              </div>
              <div className="delivery-item">
                <div className="delivery-count delivered">{stats.today.messagesDelivered}</div>
                <div className="delivery-label">Delivered</div>
              </div>
              <div className="delivery-item">
                <div className="delivery-count failed">{stats.today.messagesFailed}</div>
                <div className="delivery-label">Failed</div>
              </div>
              <div className="delivery-item">
                <div className="delivery-count opened">{stats.today.messagesOpened}</div>
                <div className="delivery-label">Opened</div>
              </div>
            </div>
          </Card>

          {/* Campaign Pipeline */}
          <Card title="Campaign Pipeline">
            <div className="pipeline-list">
              <div className="pipeline-item">
                <span className="pipeline-label">Drafts</span>
                <span className="pipeline-value">{stats.campaigns.draft}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Pending Approval</span>
                <span className="pipeline-value pending">{stats.campaigns.pending}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Scheduled</span>
                <span className="pipeline-value">{stats.campaigns.scheduled}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Sent</span>
                <span className="pipeline-value sent">{stats.campaigns.sent}</span>
              </div>
            </div>
          </Card>

          {/* Segments */}
          <Card title="Audience Segments">
            <div className="segments-list">
              {stats.segments.map((seg: any) => (
                <div key={seg.name} className="segment-item">
                  <span className="segment-name">{seg.name.replace(/_/g, ' ')}</span>
                  <span className="segment-count">{seg.contactCount}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Info */}
          <div className="quick-info">
            <p className="info-text">👥 <strong>{stats.contacts.total}</strong> total contacts</p>
            <p className="info-text">📋 <strong>{stats.campaigns.total}</strong> total campaigns</p>
            <p className="info-text">🔄 <strong>{stats.sequences.enrollments}</strong> active enrollments</p>
          </div>
        </aside>
      </div>

      <footer className="dashboard-footer">
        <p>Communication Hub | Tsunami Unleashed | CC0-1.0 License</p>
        <p className="footer-note">Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          padding: 1.5rem;
        }
        .dashboard-header {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stats-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        .campaigns-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .campaign-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .campaign-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .campaign-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .campaign-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .campaign-date {
          font-size: 0.75rem;
          color: #9ca3af;
          white-space: nowrap;
        }
        .empty-text {
          color: #9ca3af;
          font-size: 0.875rem;
          text-align: center;
          padding: 1rem 0;
        }
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        .alert-message {
          font-size: 0.875rem;
          color: #374151;
          flex: 1;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .delivery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .delivery-item {
          text-align: center;
        }
        .delivery-count {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .delivery-count.sent { color: #2563eb; }
        .delivery-count.delivered { color: #10b981; }
        .delivery-count.failed { color: #ef4444; }
        .delivery-count.opened { color: #8b5cf6; }
        .delivery-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }
        .pipeline-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pipeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .pipeline-item:last-child {
          border-bottom: none;
        }
        .pipeline-label {
          font-size: 0.875rem;
          color: #374151;
        }
        .pipeline-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .pipeline-value.pending { color: #f59e0b; }
        .pipeline-value.sent { color: #10b981; }
        .segments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .segment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        .segment-name {
          font-size: 0.875rem;
          color: #374151;
          text-transform: capitalize;
        }
        .segment-count {
          font-size: 0.875rem;
          font-weight: 700;
          color: #2563eb;
        }
        .quick-info {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-text {
          font-size: 0.875rem;
          color: #374151;
          margin: 0;
        }
        .dashboard-footer {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }
        .dashboard-footer p {
          margin: 0.25rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }
        .footer-note {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .dashboard {
            padding: 1rem;
          }
          .title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
