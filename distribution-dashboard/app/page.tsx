import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [tierCapacities, platformHealth, todayMetric] = await Promise.all([
    prisma.tierCapacity.findMany({ orderBy: { tier: 'asc' } }),
    prisma.platformHealth.findMany({ orderBy: { platform: 'asc' } }),
    prisma.pipelineMetric.findFirst({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  return { tierCapacities, platformHealth, todayMetric }
}

export default async function Home() {
  const { tierCapacities, platformHealth, todayMetric } = await getDashboardData()

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌊 Tsunami Unleashed</h1>
        <h2 style={{ fontSize: '1.5rem', color: '#6b7280' }}>Distribution Dashboard</h2>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tier Capacities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {tierCapacities.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Tier {tier.tier}</h4>
              <p>
                <strong>Total Slots:</strong> {tier.totalSlots === -1 ? 'Unlimited' : tier.totalSlots}
              </p>
              <p>
                <strong>Used:</strong> {tier.usedSlots}
              </p>
              {tier.tier === 1 && (
                <>
                  <p>
                    <strong>Reserved:</strong> {tier.reservedSlots}
                  </p>
                  <p>
                    <strong>Available:</strong> {tier.availableSlots}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Platform Health</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Platform</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tier</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tool</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>24h Failures</th>
              </tr>
            </thead>
            <tbody>
              {platformHealth.map((platform) => (
                <tr key={platform.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{platform.platform}</td>
                  <td style={{ padding: '0.75rem' }}>Tier {platform.tier}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        backgroundColor: platform.status === 'healthy' ? '#d1fae5' : '#fee2e2',
                        color: platform.status === 'healthy' ? '#065f46' : '#991b1b',
                      }}
                    >
                      {platform.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{platform.managementTool}</td>
                  <td style={{ padding: '0.75rem' }}>{platform.failureCount24h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Today&apos;s Metrics</h3>
        {todayMetric ? (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Posts</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{todayMetric.totalPosts}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Successful</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
                  {todayMetric.successfulPosts}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Failed</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>{todayMetric.failedPosts}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Success Rate</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{todayMetric.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>No metrics available for today</p>
        )}
      </section>

      <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          🌊 Tsunami Unleashed Distribution Dashboard | CC0-1.0 License
        </p>
      </footer>
    </div>
  )
}
