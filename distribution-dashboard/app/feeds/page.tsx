'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function FeedsPage() {
  const { data, error } = useSWR('/api/feeds', fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading feeds</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  const tierGroups = {
    1: data.feeds.filter((f: any) => f.tier === 1),
    2: data.feeds.filter((f: any) => f.tier === 2),
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡 RSS Feeds</h1>
        <p style={{ color: '#6b7280' }}>Monitor RSS feed distribution and performance</p>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Feeds" value={data.stats.total} icon="📡" color="blue" />
        <StatCard label="Tier 1 Feeds" value={data.stats.tier1} icon="🔒" color="green" />
        <StatCard label="Tier 2 Feeds" value={data.stats.tier2} icon="🌐" color="gray" />
        <StatCard label="Active Feeds" value={data.stats.active} icon="✅" color="green" />
      </div>

      {/* Tier 1 Feeds */}
      <Card title="Tier 1: RSS Vault (RSSground)" subtitle={`${tierGroups[1].length} feeds • Lifetime limit: 150 slots`}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tierGroups[1].map((feed: any) => (
            <FeedCard key={feed.id} feed={feed} />
          ))}
        </div>
      </Card>

      {/* Tier 2 Feeds */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Tier 2: External Feeds (Ghost/Cloudflare)" subtitle={`${tierGroups[2].length} feeds • Unlimited capacity`}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tierGroups[2].map((feed: any) => (
              <FeedCard key={feed.id} feed={feed} />
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

function FeedCard({ feed }: { feed: any }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {feed.feedName}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <span>Language: {feed.language.toUpperCase()}</span>
          <span>•</span>
          <span>Tool: {feed.managementTool}</span>
          {feed.subscriberCount > 0 && (
            <>
              <span>•</span>
              <span>Subscribers: {feed.subscriberCount}</span>
            </>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {feed.feedUrl}
        </div>
      </div>
      <Badge
        variant={feed.isActive ? 'success' : 'error'}
        size="md"
      >
        {feed.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </div>
  )
}
