'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PlatformsPage() {
  const { data, error } = useSWR('/api/platforms', fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading platforms</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  const tierGroups = {
    1: data.platforms.filter((p: any) => p.tier === 1),
    2: data.platforms.filter((p: any) => p.tier === 2),
    3: data.platforms.filter((p: any) => p.tier === 3),
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💚 Platform Health</h1>
        <p style={{ color: '#6b7280' }}>Monitor platform status and performance</p>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Platforms" value={data.stats.total} icon="📡" color="blue" />
        <StatCard label="Healthy" value={data.stats.healthy} icon="✅" color="green" />
        <StatCard label="Degraded" value={data.stats.degraded} icon="⚠️" color="yellow" />
        <StatCard label="Down" value={data.stats.down} icon="❌" color="red" />
      </div>

      {/* Tier 1 Platforms */}
      <Card title="Tier 1: RSS Vault" subtitle={`${tierGroups[1].length} platforms`}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tierGroups[1].map((platform: any) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </Card>

      {/* Tier 2 Platforms */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Tier 2: External Feeds" subtitle={`${tierGroups[2].length} platforms`}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tierGroups[2].map((platform: any) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </Card>
      </div>

      {/* Tier 3 Platforms */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Tier 3: Platform-Native" subtitle={`${tierGroups[3].length} platforms`}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tierGroups[3].map((platform: any) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: '#2563eb', fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function PlatformCard({ platform }: { platform: any }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {platform.platform}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <span>Tool: {platform.managementTool}</span>
          <span>•</span>
          <span>24h Failures: {platform.failureCount24h}</span>
        </div>
      </div>
      <Badge
        variant={platform.status === 'healthy' ? 'success' : platform.status === 'degraded' ? 'warning' : 'error'}
        size="md"
      >
        {platform.status}
      </Badge>
    </div>
  )
}
