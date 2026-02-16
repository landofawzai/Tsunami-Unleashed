'use client'

// Distribution Dashboard Home Page
// Real-time overview with 30-second auto-refresh

import useSWR from 'swr'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Home() {
  // Auto-refresh every 30 seconds
  const { data: stats, error: statsError } = useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 30000,
  })

  const { data: capacity } = useSWR('/api/dashboard/capacity', fetcher, {
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

  if (!stats || !capacity) {
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

  const tier1 = capacity.capacities.find((c: any) => c.tier === 1)

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="title">🌊 Tsunami Unleashed</h1>
            <p className="subtitle">Distribution Dashboard</p>
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
              label="Total Posts Today"
              value={stats.today.posts}
              trend={stats.trends.posts}
              icon="📊"
              color="blue"
            />
            <StatCard
              label="Success Rate"
              value={`${stats.today.successRate.toFixed(1)}%`}
              trend={stats.trends.successRate}
              icon="✅"
              color={stats.today.successRate >= 75 ? 'green' : stats.today.successRate >= 50 ? 'yellow' : 'red'}
            />
            <StatCard
              label="Active Content"
              value={stats.content.active}
              icon="⚡"
              color="blue"
            />
            <StatCard
              label="Platform Health"
              value={`${stats.platforms.healthy}/${stats.platforms.total}`}
              icon="💚"
              color={stats.platforms.healthPercentage >= 80 ? 'green' : 'yellow'}
            />
          </div>

          {/* Today's Breakdown */}
          <Card title="Today's Distribution" subtitle="Posts by tier">
            <div className="tier-breakdown">
              <div className="tier-item">
                <div className="tier-label">
                  <span className="tier-badge tier-1">Tier 1</span>
                  <span className="tier-desc">RSS Vault</span>
                </div>
                <div className="tier-value">{stats.today.tier1}</div>
              </div>
              <div className="tier-item">
                <div className="tier-label">
                  <span className="tier-badge tier-2">Tier 2</span>
                  <span className="tier-desc">External Feeds</span>
                </div>
                <div className="tier-value">{stats.today.tier2}</div>
              </div>
              <div className="tier-item">
                <div className="tier-label">
                  <span className="tier-badge tier-3">Tier 3</span>
                  <span className="tier-desc">Platform-Native</span>
                </div>
                <div className="tier-value">{stats.today.tier3}</div>
              </div>
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
          {/* Tier 1 Capacity */}
          <Card title="Tier 1 Capacity" subtitle="RSS Vault Slots">
            <div className="capacity-widget">
              <div className="capacity-numbers">
                <div className="capacity-item">
                  <span className="capacity-label">Available</span>
                  <span className="capacity-value available">{tier1?.availableSlots || 0}</span>
                </div>
                <div className="capacity-divider"></div>
                <div className="capacity-item">
                  <span className="capacity-label">Used</span>
                  <span className="capacity-value used">{tier1?.usedSlots || 0}</span>
                </div>
                <div className="capacity-divider"></div>
                <div className="capacity-item">
                  <span className="capacity-label">Reserved</span>
                  <span className="capacity-value reserved">{tier1?.reservedSlots || 0}</span>
                </div>
              </div>

              <div className="capacity-bar">
                <div className="capacity-bar-fill" style={{ width: `${tier1?.usagePercentage || 0}%` }}></div>
              </div>

              <div className="capacity-total">
                <span className="total-label">Total Slots</span>
                <span className="total-value">{tier1?.totalSlots || 150}</span>
              </div>
            </div>
          </Card>

          {/* Content Status */}
          <Card title="Content Status">
            <div className="status-grid">
              <div className="status-item">
                <div className="status-count completed">{stats.content.completed}</div>
                <div className="status-label">Completed</div>
              </div>
              <div className="status-item">
                <div className="status-count active">{stats.content.active}</div>
                <div className="status-label">In Progress</div>
              </div>
              <div className="status-item">
                <div className="status-count failed">{stats.content.failed}</div>
                <div className="status-label">Failed</div>
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <div className="quick-info">
            <p className="info-text">📡 <strong>{stats.platforms.total}</strong> platforms monitored</p>
            <p className="info-text">📨 <strong>{stats.content.total}</strong> total content items</p>
            <p className="info-text">✅ <strong>{stats.today.successful}</strong> successful posts today</p>
          </div>
        </aside>
      </div>

      <footer className="dashboard-footer">
        <p>🌊 Tsunami Unleashed Distribution Dashboard | CC0-1.0 License</p>
        <p className="footer-note">Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .tier-breakdown {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .tier-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .tier-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .tier-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .tier-1 { background: #dbeafe; color: #1e40af; }
        .tier-2 { background: #d1fae5; color: #065f46; }
        .tier-3 { background: #fef3c7; color: #92400e; }
        .tier-desc {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .tier-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
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
        .capacity-widget {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .capacity-numbers {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .capacity-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .capacity-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }
        .capacity-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 0.25rem;
        }
        .capacity-value.available { color: #10b981; }
        .capacity-value.used { color: #2563eb; }
        .capacity-value.reserved { color: #f59e0b; }
        .capacity-divider {
          width: 1px;
          height: 2rem;
          background: #e5e7eb;
        }
        .capacity-bar {
          height: 0.75rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }
        .capacity-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transition: width 0.3s ease;
        }
        .capacity-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
        }
        .total-label {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .total-value {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .status-item {
          text-align: center;
        }
        .status-count {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .status-count.completed { color: #10b981; }
        .status-count.active { color: #2563eb; }
        .status-count.failed { color: #ef4444; }
        .status-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
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
