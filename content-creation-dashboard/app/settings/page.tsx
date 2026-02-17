// Settings Page
// API keys, Pabbly URLs, default config, tag management, event log, system info

'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [saving, setSaving] = useState(false)

  // Settings
  const { data: settingsData } = useSWR('/api/settings', fetcher)
  const settings = settingsData?.settings || {}

  // Tags
  const { data: tagsData } = useSWR('/api/tags', fetcher)
  const tags = tagsData?.tags || []

  // Pabbly Events
  const { data: eventsData } = useSWR('/api/pabbly-events?limit=20', fetcher, {
    refreshInterval: 30000,
  })
  const events = eventsData?.events || []

  // Setting values
  const [apiKey, setApiKey] = useState('')
  const [pabblyUrl, setPabblyUrl] = useState('')
  const [defaultLanguage, setDefaultLanguage] = useState('')
  const [targetLanguages, setTargetLanguages] = useState('')

  useEffect(() => {
    if (settings.api_key) setApiKey(settings.api_key.value)
    if (settings.pabbly_webhook_url) setPabblyUrl(settings.pabbly_webhook_url.value)
    if (settings.default_language) setDefaultLanguage(settings.default_language.value)
    if (settings.target_languages) setTargetLanguages(settings.target_languages.value)
  }, [settingsData])

  async function saveSettings() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            api_key: apiKey,
            pabbly_webhook_url: pabblyUrl,
            default_language: defaultLanguage,
            target_languages: targetLanguages,
          },
        }),
      })
      mutate('/api/settings')
    } finally {
      setSaving(false)
    }
  }

  // Tag creation
  const [newTagName, setNewTagName] = useState('')
  const [newTagCategory, setNewTagCategory] = useState('topic')
  const [creatingTag, setCreatingTag] = useState(false)

  async function createTag(e: React.FormEvent) {
    e.preventDefault()
    if (!newTagName.trim()) return
    setCreatingTag(true)
    try {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), category: newTagCategory }),
      })
      setNewTagName('')
      mutate('/api/tags')
    } finally {
      setCreatingTag(false)
    }
  }

  const sections = [
    { key: 'general', label: 'General' },
    { key: 'tags', label: 'Tags' },
    { key: 'events', label: 'Event Log' },
    { key: 'system', label: 'System Info' },
  ]

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Dashboard configuration & management</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.key}
              className={`nav-item ${activeSection === section.key ? 'active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeSection === 'general' && (
            <div className="section">
              <Card title="API Configuration">
                <div className="form">
                  <div className="form-group">
                    <label>API Key (x-api-key for webhooks)</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Webhook API key..." />
                  </div>
                  <div className="form-group">
                    <label>Pabbly Webhook URL (to Repurposing)</label>
                    <input value={pabblyUrl} onChange={(e) => setPabblyUrl(e.target.value)} placeholder="https://connect.pabbly.com/..." />
                  </div>
                  <div className="form-group">
                    <label>Default Language</label>
                    <input value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} placeholder="en" />
                  </div>
                  <div className="form-group">
                    <label>Target Languages (comma-separated)</label>
                    <input value={targetLanguages} onChange={(e) => setTargetLanguages(e.target.value)} placeholder="hi,bn,mai,ta,te,kn,ml" />
                    <span className="form-hint">Languages content will be translated into by Pillar 2</span>
                  </div>
                  <button className="btn-primary" onClick={saveSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'tags' && (
            <div className="section">
              <Card title="Content Tags">
                <form onSubmit={createTag} className="tag-form">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name..."
                  />
                  <select value={newTagCategory} onChange={(e) => setNewTagCategory(e.target.value)}>
                    <option value="topic">Topic</option>
                    <option value="book">Book</option>
                    <option value="audience">Audience</option>
                    <option value="season">Season</option>
                  </select>
                  <button type="submit" className="btn-primary" disabled={creatingTag || !newTagName.trim()}>
                    {creatingTag ? '...' : 'Add Tag'}
                  </button>
                </form>

                <div className="tags-list">
                  {tags.length === 0 ? (
                    <p className="empty-text">No tags yet.</p>
                  ) : (
                    <div className="tags-grid">
                      {tags.map((tag: any) => (
                        <div key={tag.id} className="tag-item">
                          <span className="tag-name">{tag.name}</span>
                          <div className="tag-meta">
                            <Badge variant="neutral" size="sm">{tag.category}</Badge>
                            <span className="tag-count">{tag.usageCount} uses</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'events' && (
            <div className="section">
              <Card title="Pabbly Event Log" subtitle="Recent webhook events">
                {events.length === 0 ? (
                  <p className="empty-text">No webhook events logged yet.</p>
                ) : (
                  <div className="events-list">
                    {events.map((event: any) => (
                      <div key={event.id} className="event-item">
                        <div className="event-header">
                          <Badge
                            variant={event.status === 'success' ? 'success' : event.status === 'failed' ? 'error' : 'warning'}
                            size="sm"
                          >
                            {event.status}
                          </Badge>
                          <Badge variant={event.direction === 'inbound' ? 'info' : 'teal'} size="sm">
                            {event.direction}
                          </Badge>
                          <span className="event-workflow">{event.workflowName}</span>
                        </div>
                        <div className="event-meta">
                          <span>{event.eventType}</span>
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                        {event.errorMessage && <p className="event-error">{event.errorMessage}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="section">
              <Card title="System Information">
                <div className="info-rows">
                  <InfoRow label="Dashboard" value="Content Creation (Pillar 1)" />
                  <InfoRow label="Version" value="1.0.0" />
                  <InfoRow label="Framework" value="Next.js 14 + Prisma + SQLite" />
                  <InfoRow label="Port" value="3003" />
                  <InfoRow label="nginx Proxy" value="3082" />
                  <InfoRow label="PM2 Name" value="tsunami-creation" />
                  <InfoRow label="Database" value="SQLite (prisma/dev.db)" />
                  <InfoRow label="Refresh Interval" value="30 seconds (SWR)" />
                  <InfoRow label="Color Theme" value="Green/Emerald (#10b981)" />
                </div>
              </Card>

              <Card title="Integration Endpoints">
                <div className="info-rows">
                  <InfoRow label="Content from Drive" value="POST /api/webhooks/content-from-drive" />
                  <InfoRow label="Repurposing Status" value="POST /api/webhooks/repurposing-status" />
                  <InfoRow label="Send to Repurposing" value="POST /api/content/[id]/send-to-repurposing" />
                  <InfoRow label="Auth Header" value="x-api-key: [configured key]" />
                </div>
              </Card>

              <Card title="Pillar Architecture">
                <div className="info-rows">
                  <InfoRow label="Pillar 1" value="Content Creation (this dashboard) — :3003/:3082" />
                  <InfoRow label="Pillar 2" value="Content Repurposing — :3002/:3080" />
                  <InfoRow label="Pillar 3" value="Distribution — :3000/:80" />
                  <InfoRow label="Pillar 4" value="Communication — :3001/:3081" />
                  <InfoRow label="Pillar 5" value="Administration — Not yet built" />
                  <InfoRow label="Pillar 6" value="Discipling — Not yet built" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .settings-page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; }

        .settings-layout { display: grid; grid-template-columns: 180px 1fr; gap: 1.5rem; }
        .settings-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item {
          text-align: left; padding: 0.625rem 1rem; border: none; background: none;
          font-size: 0.875rem; color: #6b7280; cursor: pointer; border-radius: 8px;
          font-weight: 500; transition: background 0.2s, color 0.2s;
        }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #d1fae5; color: #065f46; font-weight: 600; }

        .settings-content { min-width: 0; }
        .section { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Forms */
        .form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
        .form-group input {
          padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 0.875rem; color: #111827;
        }
        .form-group input:focus {
          outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .form-hint { font-size: 0.75rem; color: #9ca3af; }
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #047857); color: white; border: none;
          padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem;
          cursor: pointer; align-self: flex-start;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Tags */
        .tag-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .tag-form input {
          flex: 1; padding: 0.4rem 0.75rem; border: 1px solid #d1d5db;
          border-radius: 6px; font-size: 0.85rem;
        }
        .tag-form select {
          padding: 0.4rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 0.85rem; background: white;
        }
        .tags-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .tag-item {
          display: flex; flex-direction: column; gap: 0.25rem;
          padding: 0.5rem 0.75rem; background: #f9fafb; border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .tag-name { font-size: 0.85rem; font-weight: 600; color: #111827; }
        .tag-meta { display: flex; align-items: center; gap: 0.375rem; }
        .tag-count { font-size: 0.7rem; color: #9ca3af; }

        /* Events */
        .events-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .event-item {
          padding: 0.75rem; background: #f9fafb; border-radius: 8px;
        }
        .event-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .event-workflow { font-size: 0.8rem; color: #374151; font-weight: 500; }
        .event-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #6b7280; }
        .event-error { font-size: 0.8rem; color: #ef4444; margin: 0.25rem 0 0 0; }

        /* Info */
        .info-rows { display: flex; flex-direction: column; gap: 0.5rem; }

        .empty-text { color: #9ca3af; text-align: center; margin: 0; }

        @media (max-width: 768px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-nav { flex-direction: row; overflow-x: auto; }
          .tag-form { flex-direction: column; }
        }
        @media (max-width: 640px) { .settings-page { padding: 1rem; } }
      `}</style>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
      <style jsx>{`
        .info-row { display: flex; justify-content: space-between; padding: 0.375rem 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 0.8rem; color: #6b7280; }
        .info-value { font-size: 0.8rem; color: #111827; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
      `}</style>
    </div>
  )
}
