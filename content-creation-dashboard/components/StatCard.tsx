// StatCard Component
// Dashboard stat display with colored left border

interface StatCardProps {
  label: string
  value: string | number
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'teal'
  trend?: string
  subtitle?: string
}

export function StatCard({ label, value, color = 'green', subtitle, trend }: StatCardProps) {
  const colors = {
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    red: '#ef4444',
    gray: '#6b7280',
    teal: '#14b8a6',
  }

  const borderColor = colors[color]

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      {trend && <div className="stat-trend">{trend}</div>}

      <style jsx>{`
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid ${borderColor};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }
        .stat-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        .stat-trend {
          font-size: 0.75rem;
          color: ${borderColor};
          margin-top: 0.25rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
