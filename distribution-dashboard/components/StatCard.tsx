// StatCard Component
// Displays key metrics with visual indicators

interface StatCardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}

export function StatCard({ label, value, trend, icon, color = 'blue' }: StatCardProps) {
  const colors = {
    blue: { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' },
    green: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    yellow: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    red: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    gray: { bg: '#f3f4f6', text: '#1f2937', border: '#6b7280' },
  }

  const selectedColor = colors[color]

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`stat-trend trend-${trend.direction}`}>
          <span className="trend-arrow">
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
          </span>
          <span className="trend-value">{Math.abs(trend.value)}%</span>
        </div>
      )}

      <style jsx>{`
        .stat-card {
          background: ${selectedColor.bg};
          border-left: 4px solid ${selectedColor.border};
          padding: 1.25rem;
          border-radius: 8px;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: ${selectedColor.text};
          opacity: 0.8;
        }

        .stat-icon {
          font-size: 1.25rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: ${selectedColor.text};
          line-height: 1;
        }

        .stat-trend {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .trend-up {
          color: #10b981;
        }

        .trend-down {
          color: #ef4444;
        }

        .trend-neutral {
          color: #6b7280;
        }

        .trend-arrow {
          font-size: 1rem;
        }
      `}</style>
    </div>
  )
}
