'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const { data, error } = useSWR('/api/settings', fetcher, {
    refreshInterval: 30000,
  })

  if (error) return <div style={{ padding: '2rem' }}>Error loading settings</div>
  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(label)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️ Settings</h1>
        <p style={{ color: '#6b7280' }}>System configuration and webhook endpoints</p>
      </header>

      {/* System Information */}
      <Card title="System Information">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Version</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{data.systemInfo.version}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Environment</span>
            <Badge variant={data.systemInfo.environment === 'production' ? 'success' : 'warning'} size="sm">
              {data.systemInfo.environment}
            </Badge>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Database</span>
            <Badge variant={data.systemInfo.databaseUrl === 'Connected' ? 'success' : 'error'} size="sm">
              {data.systemInfo.databaseUrl}
            </Badge>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>API Key</span>
            <Badge variant={data.systemInfo.apiKeyConfigured ? 'success' : 'error'} size="sm">
              {data.systemInfo.apiKeyConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Webhook URLs */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Webhook Endpoints" subtitle="Use these URLs in Pabbly Connect workflows">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                Content Posted (Success)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={data.webhookUrls.contentPosted}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                  }}
                />
                <button
                  onClick={() => copyToClipboard(data.webhookUrls.contentPosted, 'posted')}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {copiedUrl === 'posted' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Trigger this webhook when content is successfully posted to a platform
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                Content Failed (Error)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={data.webhookUrls.contentFailed}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                  }}
                />
                <button
                  onClick={() => copyToClipboard(data.webhookUrls.contentFailed, 'failed')}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {copiedUrl === 'failed' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Trigger this webhook when content fails to post to a platform
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '6px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
              Authentication Required
            </div>
            <p style={{ fontSize: '0.75rem', color: '#1e40af' }}>
              All webhook requests must include an <code style={{ background: '#dbeafe', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>x-api-key</code> header with your API key configured in the <code style={{ background: '#dbeafe', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>.env</code> file.
            </p>
          </div>
        </Card>
      </div>

      {/* Tier Capacity Configuration */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Tier Capacity" subtitle="Slot allocation and usage tracking">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.tierCapacities.map((tier: any) => (
              <div
                key={tier.tier}
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Tier {tier.tier}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {tier.totalSlots === -1 ? 'Unlimited capacity' : `${tier.totalSlots} total slots`}
                    </div>
                  </div>
                  <Badge
                    variant={
                      tier.availableSlots > 50 || tier.totalSlots === -1
                        ? 'success'
                        : tier.availableSlots > 20
                        ? 'warning'
                        : 'error'
                    }
                    size="md"
                  >
                    {tier.availableSlots} available
                  </Badge>
                </div>

                {tier.totalSlots !== -1 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <span>Used: {tier.usedSlots}</span>
                      <span>Reserved: {tier.reservedSlots}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(tier.usedSlots / tier.totalSlots) * 100}%`,
                          height: '100%',
                          background: tier.usedSlots / tier.totalSlots > 0.8 ? '#ef4444' : tier.usedSlots / tier.totalSlots > 0.6 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Documentation Links */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Documentation">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <a
              href="/api-docs"
              style={{
                display: 'block',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '6px',
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              📖 API Documentation →
            </a>
            <a
              href="https://github.com/landofawzai/Tsunami-Unleashed"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '6px',
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              💻 GitHub Repository →
            </a>
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
