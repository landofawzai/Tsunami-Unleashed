'use client'

// Settings Page
// System configuration, webhook URLs, and database stats

import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { StatCard } from '@/components/StatCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const { data, error } = useSWR('/api/settings', fetcher, {
    refreshInterval: 30000,
  })

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Error loading settings</h1>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading settings...</div>
    )
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and status</p>
      </div>

      {/* Database Stats */}
      <div className="stats-grid">
        <StatCard label="Total Contacts" value={data.stats.contacts.total} icon="👥" color="blue" />
        <StatCard label="Active Contacts" value={data.stats.contacts.active} icon="✅" color="green" />
        <StatCard label="Campaigns" value={data.stats.campaigns} icon="📋" color="purple" />
        <StatCard label="Segments" value={data.stats.segments} icon="🏷️" color="orange" />
        <StatCard label="Templates" value={data.stats.templates} icon="📝" color="blue" />
        <StatCard label="Sequences" value={data.stats.sequences} icon="🔄" color="purple" />
        <StatCard label="Broadcasts" value={data.stats.broadcasts} icon="📡" color="green" />
        <StatCard label="Deliveries" value={data.stats.deliveries} icon="📨" color="blue" />
      </div>

      <div className="settings-grid">
        {/* System Info */}
        <Card title="System Information">
          <div className="info-list">
            <div className="info-row">
              <span>Name</span>
              <span>{data.system.name}</span>
            </div>
            <div className="info-row">
              <span>Version</span>
              <Badge variant="info" size="sm">{data.system.version}</Badge>
            </div>
            <div className="info-row">
              <span>Framework</span>
              <span>{data.system.framework}</span>
            </div>
            <div className="info-row">
              <span>Database</span>
              <span>{data.system.database}</span>
            </div>
          </div>
        </Card>

        {/* AI Configuration */}
        <Card title="AI Configuration">
          <div className="info-list">
            <div className="info-row">
              <span>Anthropic API Key</span>
              <Badge
                variant={data.ai.anthropicApiKey === 'configured' ? 'success' : 'warning'}
                size="sm"
              >
                {data.ai.anthropicApiKey}
              </Badge>
            </div>
            <div className="info-row">
              <span>Model</span>
              <span>{data.ai.model}</span>
            </div>
            <div className="info-row">
              <span>Channel Adaptation</span>
              <Badge
                variant={data.ai.channelAdaptation.startsWith('enabled') ? 'success' : 'warning'}
                size="sm"
              >
                {data.ai.channelAdaptation}
              </Badge>
            </div>
            <div className="info-row">
              <span>Translation</span>
              <Badge
                variant={data.ai.translation.startsWith('enabled') ? 'success' : 'warning'}
                size="sm"
              >
                {data.ai.translation}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Webhook Endpoints */}
        <Card title="Webhook Endpoints" subtitle="Incoming webhook URLs (for Pabbly)">
          <div className="info-list">
            <div className="info-row">
              <span>Delivery Status</span>
              <code className="endpoint">{data.webhooks.deliveryCallback}</code>
            </div>
            <div className="info-row">
              <span>Campaign from Drive</span>
              <code className="endpoint">{data.webhooks.campaignFromDrive}</code>
            </div>
            <div className="info-row">
              <span>Sequence Trigger</span>
              <code className="endpoint">{data.webhooks.sequenceTrigger}</code>
            </div>
          </div>
        </Card>

        {/* Pabbly Outbound Webhooks */}
        <Card title="Pabbly Outbound Webhooks" subtitle="Channel delivery webhook status">
          <div className="info-list">
            {Object.entries(data.webhooks)
              .filter(([key]) => key.startsWith('pabbly'))
              .map(([key, value]) => (
                <div key={key} className="info-row">
                  <span>{key.replace('pabbly', '').replace('Url', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Badge
                    variant={(value as string) === 'configured' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {value as string}
                  </Badge>
                </div>
              ))}
          </div>
        </Card>

        {/* Delivery Tools */}
        <Card title="Delivery Tools" subtitle="Channel-to-tool mapping">
          <div className="info-list">
            {Object.entries(data.deliveryTools).map(([channel, tool]) => (
              <div key={channel} className="info-row">
                <span className="channel-name">{channel.replace('_', ' ')}</span>
                <span className="tool-name">{tool as string}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Supported Channels */}
        <Card title="Supported Channels">
          <div className="channel-badges">
            {data.channels.map((ch: string) => (
              <Badge key={ch} variant="info" size="md">
                {ch.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <style jsx>{`
        .settings-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .page-header {
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
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.8125rem;
        }
        .info-row:last-child { border-bottom: none; }
        .info-row span:first-child {
          color: #6b7280;
        }
        .info-row span:last-child {
          font-weight: 600;
          color: #111827;
        }
        .endpoint {
          font-size: 0.75rem;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: #374151;
        }
        .channel-name {
          text-transform: capitalize;
        }
        .tool-name {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: right;
          max-width: 200px;
        }
        .channel-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        @media (max-width: 1024px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
