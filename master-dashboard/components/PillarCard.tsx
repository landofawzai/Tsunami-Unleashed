// PillarCard Component
// Summary card per pillar — shows status, key metrics, color accent, and external link

import { PillarConfig } from '@/lib/pillar-config'

interface PillarStats {
  status: 'up' | 'down' | 'not_built'
  responseMs: number | null
  data: Record<string, unknown> | null
}

interface PillarCardProps {
  pillar: PillarConfig
  stats?: PillarStats
}

export function PillarCard({ pillar, stats }: PillarCardProps) {
  const isNotBuilt = !pillar.enabled
  const isDown = stats?.status === 'down'
  const isUp = stats?.status === 'up'

  return (
    <div className="pillar-card">
      <div className="pillar-header">
        <div className="pillar-number">P{pillar.number}</div>
        <div className="pillar-info">
          <h3 className="pillar-name">{pillar.name}</h3>
          <p className="pillar-description">{pillar.description}</p>
        </div>
        <div className="pillar-status">
          {isNotBuilt && <span className="status-badge not-built">Coming Soon</span>}
          {isUp && <span className="status-badge up">Online</span>}
          {isDown && <span className="status-badge down">Offline</span>}
          {!stats && pillar.enabled && <span className="status-badge loading">Loading...</span>}
        </div>
      </div>

      {pillar.enabled && stats?.data && (
        <div className="pillar-metrics">
          {Object.entries(stats.data).slice(0, 4).map(([key, value]) => (
            <div key={key} className="metric">
              <span className="metric-value">{String(value)}</span>
              <span className="metric-label">{formatKey(key)}</span>
            </div>
          ))}
        </div>
      )}

      {isNotBuilt && pillar.plannedFeatures && (
        <div className="planned-features">
          <span className="planned-label">Planned Features:</span>
          <ul className="feature-list">
            {pillar.plannedFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pillar-footer">
        {pillar.enabled ? (
          <a
            href={pillar.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pillar-link"
          >
            Open Dashboard &rarr;
          </a>
        ) : (
          <span className="pillar-port">Reserved: port {pillar.appPort}/{pillar.nginxPort}</span>
        )}
        {stats?.responseMs != null && (
          <span className="response-time">{stats.responseMs}ms</span>
        )}
      </div>

      <style jsx>{`
        .pillar-card {
          background: white;
          border-radius: 12px;
          border-left: 4px solid ${pillar.color};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          opacity: ${isNotBuilt ? '0.7' : '1'};
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pillar-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .pillar-header {
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .pillar-number {
          background: ${pillar.color};
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .pillar-info {
          flex: 1;
          min-width: 0;
        }
        .pillar-name {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .pillar-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
          line-height: 1.4;
        }
        .pillar-status {
          flex-shrink: 0;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-badge.up {
          background: #d1fae5;
          color: #065f46;
        }
        .status-badge.down {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-badge.not-built {
          background: #f3f4f6;
          color: #6b7280;
        }
        .status-badge.loading {
          background: #fef3c7;
          color: #92400e;
        }
        .pillar-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          padding: 0 1.25rem 1rem;
        }
        .metric {
          text-align: center;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .metric-value {
          display: block;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
        }
        .metric-label {
          display: block;
          font-size: 0.625rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.125rem;
        }
        .planned-features {
          padding: 0 1.25rem 1rem;
        }
        .planned-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .feature-list {
          margin: 0.5rem 0 0 1.25rem;
          padding: 0;
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.6;
        }
        .pillar-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pillar-link {
          font-size: 0.8rem;
          font-weight: 600;
          color: ${pillar.color};
          text-decoration: none;
        }
        .pillar-link:hover {
          text-decoration: underline;
        }
        .pillar-port {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .response-time {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
        }
      `}</style>
    </div>
  )
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
