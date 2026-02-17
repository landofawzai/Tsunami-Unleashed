'use client'

// Content Repurposing Dashboard — Home Page
// Real-time overview with 30-second auto-refresh

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

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  pending: { variant: 'neutral', label: 'Pending' },
  processing: { variant: 'orange', label: 'Processing' },
  ready: { variant: 'success', label: 'Ready' },
  failed: { variant: 'error', label: 'Failed' },
}

const MEDIA_BADGES: Record<string, { variant: 'info' | 'purple' | 'orange' | 'neutral'; label: string }> = {
  video: { variant: 'purple', label: 'Video' },
  audio: { variant: 'info', label: 'Audio' },
  text: { variant: 'neutral', label: 'Text' },
  mixed: { variant: 'orange', label: 'Mixed' },
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
            border-top: 3px solid #f97316;
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
            <h1 className="title">Content Repurposing</h1>
            <p className="subtitle">Tsunami Unleashed — 1 Source → 500+ Derivatives → Hindi, Bengali, Maithili</p>
          </div>
          <div className="header-badge">
            <Badge variant="orange" size="sm">Auto-refresh: 30s</Badge>
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
              label="Total Sources"
              value={stats.sources.total}
              icon="📄"
              color="blue"
            />
            <StatCard
              label="Derivatives"
              value={stats.derivatives.total}
              icon="🔄"
              color="green"
            />
            <StatCard
              label="Translations"
              value={stats.translations.total}
              icon="🌐"
              color="purple"
            />
            <StatCard
              label="Sent to Distribution"
              value={stats.derivatives.sentToDistribution}
              icon="📤"
              color="orange"
            />
            <StatCard
              label="Pending Reviews"
              value={stats.translations.pendingReviews}
              icon="👁"
              color={stats.translations.pendingReviews > 0 ? 'yellow' : 'gray'}
            />
            <StatCard
              label="Unread Alerts"
              value={stats.alerts.unread}
              icon="🔔"
              color={stats.alerts.critical > 0 ? 'red' : stats.alerts.unread > 0 ? 'yellow' : 'gray'}
            />
          </div>

          {/* Pipeline Overview */}
          <Card title="Processing Pipeline" subtitle="Source → Derivatives → Translations → Distribution">
            <div className="pipeline-flow">
              <div className="pipeline-stage">
                <div className="stage-count source">{stats.sources.total}</div>
                <div className="stage-label">Sources</div>
                <div className="stage-detail">{stats.sources.processing} processing</div>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-stage">
                <div className="stage-count derivative">{stats.derivatives.total}</div>
                <div className="stage-label">Derivatives</div>
                <div className="stage-detail">8 types</div>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-stage">
                <div className="stage-count translation">{stats.translations.total}</div>
                <div className="stage-label">Translations</div>
                <div className="stage-detail">{stats.languages.length} languages</div>
              </div>
              <div className="pipeline-arrow">→</div>
              <div className="pipeline-stage">
                <div className="stage-count distribution">{stats.derivatives.sentToDistribution}</div>
                <div className="stage-label">Distributed</div>
                <div className="stage-detail">to Pillar 3</div>
              </div>
            </div>
          </Card>

          {/* Derivative Breakdown */}
          <Card title="Derivative Breakdown" subtitle="Content pieces by type">
            <div className="derivative-grid">
              {Object.entries(DERIVATIVE_LABELS).map(([type, label]) => (
                <div key={type} className="derivative-item">
                  <span className="derivative-label">{label}</span>
                  <span className="derivative-count">{stats.derivatives.byType[type] || 0}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Sources */}
          <Card title="Recent Sources" subtitle="Latest content ingested">
            <div className="sources-list">
              {stats.recentSources.length === 0 ? (
                <p className="empty-text">No sources yet. Submit content via webhook or Sources page.</p>
              ) : (
                stats.recentSources.map((source: any) => {
                  const statusBadge = STATUS_BADGES[source.status] || STATUS_BADGES.pending
                  const mediaBadge = MEDIA_BADGES[source.mediaType] || MEDIA_BADGES.text
                  return (
                    <div key={source.id} className="source-item">
                      <div className="source-info">
                        <span className="source-title">{source.title}</span>
                        <div className="source-badges">
                          <Badge variant={mediaBadge.variant} size="sm">{mediaBadge.label}</Badge>
                          <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                          <Badge variant="neutral" size="sm">{source._count.derivatives} derivatives</Badge>
                        </div>
                      </div>
                      <span className="source-date">
                        {new Date(source.createdAt).toLocaleDateString()}
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
          {/* Language Progress */}
          <Card title="Language Progress" subtitle="Translation coverage">
            <div className="languages-list">
              {stats.languages.map((lang: any) => {
                const count = stats.translations.byLanguage[lang.code] || 0
                return (
                  <div key={lang.code} className="language-item">
                    <div className="language-header">
                      <span className="language-name">{lang.name}</span>
                      <span className="language-native">{lang.nativeName}</span>
                    </div>
                    <div className="language-stats">
                      <span className="language-count">{count} translations</span>
                      {lang.hasLocalReviewer && (
                        <Badge variant="success" size="sm">Reviewer</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Translation Pipeline */}
          <Card title="Translation Status">
            <div className="pipeline-list">
              <div className="pipeline-item">
                <span className="pipeline-label">AI Drafts</span>
                <span className="pipeline-value">{stats.translations.byStatus['ai_draft'] || 0}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Pending Review</span>
                <span className="pipeline-value pending">{stats.translations.byStatus['review_pending'] || 0}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Reviewed</span>
                <span className="pipeline-value">{stats.translations.byStatus['reviewed'] || 0}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Approved</span>
                <span className="pipeline-value approved">{stats.translations.byStatus['approved'] || 0}</span>
              </div>
            </div>
          </Card>

          {/* Job Queue Status */}
          <Card title="Job Queue">
            <div className="pipeline-list">
              <div className="pipeline-item">
                <span className="pipeline-label">Queued</span>
                <span className="pipeline-value">{stats.jobs.queued}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Processing</span>
                <span className="pipeline-value pending">{stats.jobs.processing}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Completed</span>
                <span className="pipeline-value approved">{stats.jobs.completed}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Failed</span>
                <span className="pipeline-value failed">{stats.jobs.failed}</span>
              </div>
            </div>
          </Card>

          {/* Source Pipeline */}
          <Card title="Source Status">
            <div className="pipeline-list">
              <div className="pipeline-item">
                <span className="pipeline-label">Pending</span>
                <span className="pipeline-value">{stats.sources.pending}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Processing</span>
                <span className="pipeline-value pending">{stats.sources.processing}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Ready</span>
                <span className="pipeline-value approved">{stats.sources.ready}</span>
              </div>
              <div className="pipeline-item">
                <span className="pipeline-label">Failed</span>
                <span className="pipeline-value failed">{stats.sources.failed}</span>
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <div className="quick-info">
            <p className="info-text">📄 <strong>{stats.sources.total}</strong> total sources</p>
            <p className="info-text">🔄 <strong>{stats.derivatives.total}</strong> derivatives generated</p>
            <p className="info-text">🌐 <strong>{stats.translations.total}</strong> translations</p>
            <p className="info-text">📤 <strong>{stats.today.sentToDistribution}</strong> sent today</p>
          </div>
        </aside>
      </div>

      <footer className="dashboard-footer">
        <p>Content Repurposing | Tsunami Unleashed | CC0-1.0 License</p>
        <p className="footer-note">Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
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

        /* Pipeline Flow */
        .pipeline-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 1rem 0;
        }
        .pipeline-stage {
          text-align: center;
          flex: 1;
        }
        .stage-count {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .stage-count.source { color: #2563eb; }
        .stage-count.derivative { color: #10b981; }
        .stage-count.translation { color: #8b5cf6; }
        .stage-count.distribution { color: #f97316; }
        .stage-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        .stage-detail {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .pipeline-arrow {
          font-size: 1.5rem;
          color: #d1d5db;
          font-weight: 700;
        }

        /* Derivative Breakdown */
        .derivative-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        .derivative-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        .derivative-label {
          font-size: 0.875rem;
          color: #374151;
        }
        .derivative-count {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        /* Sources List */
        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .source-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .source-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .source-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .source-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .source-date {
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

        /* Alerts */
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

        /* Sidebar */
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Languages */
        .languages-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .language-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .language-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .language-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .language-native {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .language-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .language-count {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Pipeline sidebar items */
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
        .pipeline-value.approved { color: #10b981; }
        .pipeline-value.failed { color: #ef4444; }

        /* Quick Info */
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

        /* Footer */
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
          .derivative-grid {
            grid-template-columns: 1fr;
          }
          .pipeline-flow {
            flex-direction: column;
            gap: 0.25rem;
          }
          .pipeline-arrow {
            transform: rotate(90deg);
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
