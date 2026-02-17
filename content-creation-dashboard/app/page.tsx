// Content Creation Dashboard — Home
// Overview with stats, pipeline, recent content, deadlines, alerts

'use client'

import useSWR from 'swr'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  drafting: 'Drafting',
  recording: 'Recording',
  editing: 'Editing',
  review: 'Review',
  approved: 'Approved',
  finalized: 'Finalized',
  sent_to_repurposing: 'Sent',
  archived: 'Archived',
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#6b7280',
  drafting: '#3b82f6',
  recording: '#8b5cf6',
  editing: '#f59e0b',
  review: '#f97316',
  approved: '#10b981',
  finalized: '#047857',
  sent_to_repurposing: '#14b8a6',
  archived: '#9ca3af',
}

const STATUS_BADGES: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'emerald' | 'teal'> = {
  planning: 'neutral',
  drafting: 'info',
  recording: 'info',
  editing: 'warning',
  review: 'warning',
  approved: 'success',
  finalized: 'emerald',
  sent_to_repurposing: 'teal',
  archived: 'neutral',
}

const TYPE_LABELS: Record<string, string> = {
  sermon: 'Sermon',
  teaching: 'Teaching',
  article: 'Article',
  study_guide: 'Study Guide',
  testimony: 'Testimony',
}

const MEDIA_LABELS: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Text',
  mixed: 'Mixed',
}

export default function Home() {
  const { data: stats, error: statsError } = useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 30000,
  })

  const { data: alertsData } = useSWR('/api/dashboard/alerts', fetcher, {
    refreshInterval: 30000,
  })

  if (statsError) {
    return (
      <div className="error-page">
        <h2>Failed to load dashboard</h2>
        <p>Could not connect to the API. Please try again.</p>
        <style jsx>{`
          .error-page { padding: 2rem; text-align: center; color: #991b1b; }
          .error-page h2 { margin-bottom: 0.5rem; }
        `}</style>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading dashboard...</p>
        <style jsx>{`
          .loading-page {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 4rem; color: #6b7280;
          }
          .spinner {
            width: 40px; height: 40px; border: 4px solid #e5e7eb;
            border-top: 4px solid #10b981; border-radius: 50%;
            animation: spin 1s linear infinite; margin-bottom: 1rem;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const alerts = alertsData?.alerts || []
  const statusBreakdown = stats.statusBreakdown || {}
  const typeBreakdown = stats.typeBreakdown || {}
  const mediaBreakdown = stats.mediaBreakdown || {}
  const recentContent = stats.recentContent || []
  const upcomingDeadlines = stats.upcomingDeadlines || []

  // Pipeline stages in order
  const pipelineStages = ['planning', 'drafting', 'recording', 'editing', 'review', 'approved', 'finalized', 'sent_to_repurposing']
  const totalInPipeline = pipelineStages.reduce((sum, s) => sum + (statusBreakdown[s] || 0), 0)

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Content Creation Dashboard</h1>
          <p className="dashboard-subtitle">Pillar 1 — Source Content Production & Management</p>
        </div>
        <Badge variant="emerald" size="sm">Auto-refresh 30s</Badge>
      </div>

      {/* Main Layout */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="main-column">
          {/* Stat Cards */}
          <div className="stats-grid">
            <StatCard label="Total Content" value={stats.totalContent} color="green" />
            <StatCard label="In Production" value={stats.inProduction} color="blue" subtitle="Drafting + Recording + Editing" />
            <StatCard label="Pending Review" value={stats.pendingReviews} color="yellow" />
            <StatCard label="Sent to Repurposing" value={stats.totalSent} color="teal" />
            <StatCard label="Pending Tasks" value={stats.pendingTasks} color="gray" />
            <StatCard
              label="Overdue Tasks"
              value={stats.overdueTasks}
              color={stats.overdueTasks > 0 ? 'red' : 'green'}
              trend={stats.overdueTasks > 0 ? 'Needs attention' : undefined}
            />
          </div>

          {/* Production Pipeline */}
          <Card title="Production Pipeline" subtitle={`${totalInPipeline} items in active pipeline`}>
            <div className="pipeline">
              {pipelineStages.map((stage, i) => {
                const count = statusBreakdown[stage] || 0
                const pct = totalInPipeline > 0 ? (count / totalInPipeline) * 100 : 0
                return (
                  <div key={stage} className="pipeline-stage">
                    <div className="pipeline-bar-wrapper">
                      <div
                        className="pipeline-bar"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: STATUS_COLORS[stage],
                        }}
                      />
                    </div>
                    <div className="pipeline-info">
                      <span className="pipeline-label">{STATUS_LABELS[stage]}</span>
                      <span className="pipeline-count">{count}</span>
                    </div>
                    {i < pipelineStages.length - 1 && <div className="pipeline-arrow">&#8594;</div>}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Content Type Breakdown */}
          <Card title="Content Type Breakdown" subtitle="Distribution by content type">
            <div className="type-grid">
              {Object.entries(typeBreakdown).length > 0 ? (
                Object.entries(typeBreakdown).map(([type, count]) => (
                  <div key={type} className="type-item">
                    <div className="type-label">{TYPE_LABELS[type] || type}</div>
                    <div className="type-bar-wrapper">
                      <div
                        className="type-bar"
                        style={{
                          width: `${stats.totalContent > 0 ? ((count as number) / stats.totalContent) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="type-count">{count as number}</div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No content items yet</p>
              )}
            </div>
          </Card>

          {/* Recent Content */}
          <Card title="Recent Content" subtitle="Latest 5 content items">
            {recentContent.length > 0 ? (
              <div className="recent-list">
                {recentContent.map((item: any) => (
                  <div key={item.id} className="recent-item">
                    <div className="recent-info">
                      <span className="recent-id">{item.contentId}</span>
                      <span className="recent-title">{item.title}</span>
                    </div>
                    <div className="recent-meta">
                      <Badge variant={STATUS_BADGES[item.status] || 'neutral'} size="sm">
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                      <span className="recent-type">{TYPE_LABELS[item.contentType] || item.contentType}</span>
                      <span className="recent-media">{MEDIA_LABELS[item.mediaType] || item.mediaType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No content items yet</p>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="sidebar">
          {/* Quick Stats */}
          <Card title="Quick Info">
            <div className="quick-stats">
              <div className="quick-row">
                <span>Active Series</span>
                <span className="quick-value">{stats.totalSeries}</span>
              </div>
              <div className="quick-row">
                <span>Unread Alerts</span>
                <span className="quick-value" style={{ color: stats.unreadAlerts > 0 ? '#ef4444' : '#10b981' }}>
                  {stats.unreadAlerts}
                </span>
              </div>
              <div className="quick-row">
                <span>Archived</span>
                <span className="quick-value">{statusBreakdown['archived'] || 0}</span>
              </div>
            </div>
          </Card>

          {/* Media Breakdown */}
          <Card title="Media Types">
            <div className="media-list">
              {Object.entries(mediaBreakdown).length > 0 ? (
                Object.entries(mediaBreakdown).map(([media, count]) => (
                  <div key={media} className="media-item">
                    <span className="media-label">{MEDIA_LABELS[media] || media}</span>
                    <span className="media-count">{count as number}</span>
                  </div>
                ))
              ) : (
                <p className="empty-text">No data</p>
              )}
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card title="Upcoming Deadlines">
            {upcomingDeadlines.length > 0 ? (
              <div className="deadlines-list">
                {upcomingDeadlines.map((entry: any) => (
                  <div key={entry.id} className="deadline-item">
                    <div className="deadline-date">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="deadline-info">
                      <div className="deadline-title">{entry.title}</div>
                      {entry.contentItem && (
                        <div className="deadline-content">{entry.contentItem.title}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No upcoming deadlines</p>
            )}
          </Card>

          {/* Alerts */}
          <Card title="Recent Alerts">
            {alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.slice(0, 5).map((alert: any) => (
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
                {alertsData?.total > 5 && (
                  <a href="/alerts" className="alerts-more">View all {alertsData.total} alerts</a>
                )}
              </div>
            ) : (
              <p className="empty-text">No unread alerts</p>
            )}
          </Card>

          {/* Pipeline Status */}
          <Card title="Status Summary">
            <div className="status-list">
              {pipelineStages.map((stage) => {
                const count = statusBreakdown[stage] || 0
                if (count === 0) return null
                return (
                  <div key={stage} className="status-row">
                    <div className="status-dot" style={{ backgroundColor: STATUS_COLORS[stage] }} />
                    <span className="status-label">{STATUS_LABELS[stage]}</span>
                    <span className="status-count">{count}</span>
                  </div>
                )
              })}
              {totalInPipeline === 0 && <p className="empty-text">No items in pipeline</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        Last updated: {new Date().toLocaleString()}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .dashboard-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .dashboard-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 1.5rem;
        }
        .main-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        /* Pipeline */
        .pipeline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pipeline-stage {
          position: relative;
        }
        .pipeline-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .pipeline-label {
          font-size: 0.8rem;
          color: #374151;
          font-weight: 500;
        }
        .pipeline-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: #111827;
        }
        .pipeline-bar-wrapper {
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }
        .pipeline-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .pipeline-arrow {
          display: none;
        }

        /* Type Breakdown */
        .type-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .type-item {
          display: grid;
          grid-template-columns: 100px 1fr 40px;
          align-items: center;
          gap: 0.75rem;
        }
        .type-label {
          font-size: 0.85rem;
          color: #374151;
          font-weight: 500;
        }
        .type-bar-wrapper {
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }
        .type-bar {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #047857);
          border-radius: 4px;
          min-width: 4px;
        }
        .type-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #111827;
          text-align: right;
        }

        /* Recent Content */
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
          gap: 1rem;
        }
        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }
        .recent-id {
          font-size: 0.7rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .recent-title {
          font-size: 0.875rem;
          color: #111827;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .recent-type,
        .recent-media {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Quick Stats */
        .quick-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .quick-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #374151;
        }
        .quick-value {
          font-weight: 700;
          font-size: 1.125rem;
          color: #111827;
        }

        /* Media Types */
        .media-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .media-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .media-item:last-child {
          border-bottom: none;
        }
        .media-label {
          font-size: 0.85rem;
          color: #374151;
        }
        .media-count {
          font-weight: 700;
          color: #111827;
        }

        /* Deadlines */
        .deadlines-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .deadline-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .deadline-date {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10b981;
          background: #d1fae5;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          white-space: nowrap;
        }
        .deadline-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }
        .deadline-title {
          font-size: 0.85rem;
          color: #111827;
          font-weight: 500;
        }
        .deadline-content {
          font-size: 0.75rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Alerts */
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .alert-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .alert-message {
          font-size: 0.8rem;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .alerts-more {
          font-size: 0.8rem;
          color: #10b981;
          text-decoration: none;
          font-weight: 600;
          margin-top: 0.25rem;
        }
        .alerts-more:hover {
          text-decoration: underline;
        }

        /* Status Summary */
        .status-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .status-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-label {
          font-size: 0.85rem;
          color: #374151;
          flex: 1;
        }
        .status-count {
          font-weight: 700;
          font-size: 0.85rem;
          color: #111827;
        }

        /* Empty state */
        .empty-text {
          font-size: 0.85rem;
          color: #9ca3af;
          margin: 0;
        }

        /* Footer */
        .dashboard-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dashboard {
            padding: 1rem;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .recent-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .type-item {
            grid-template-columns: 80px 1fr 30px;
          }
        }
      `}</style>
    </div>
  )
}
