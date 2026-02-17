'use client'

// Settings Page — System configuration, API keys, languages, Pabbly events

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const [actionMessage, setActionMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({})
  const [showPabblyEvents, setShowPabblyEvents] = useState(false)

  const { data: settingsData, mutate: mutateSettings } = useSWR('/api/settings', fetcher)
  const { data: langData, mutate: mutateLangs } = useSWR('/api/languages', fetcher)
  const { data: pabblyData } = useSWR(
    showPabblyEvents ? '/api/pabbly-events' : null,
    fetcher
  )

  function handleSettingChange(key: string, value: string) {
    setSettingsEdits({ ...settingsEdits, [key]: value })
  }

  async function saveSettings() {
    setSaving(true)
    setActionMessage('')
    try {
      const updates = Object.entries(settingsEdits).map(([key, value]) => ({ key, value }))
      if (updates.length === 0) {
        setActionMessage('No changes to save')
        setSaving(false)
        return
      }
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSettingsEdits({})
      setActionMessage(`${updates.length} setting(s) saved`)
      mutateSettings()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleLanguage(langId: string, isActive: boolean) {
    try {
      await fetch(`/api/languages/${langId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      mutateLangs()
    } catch {
      setActionMessage('Error toggling language')
    }
  }

  async function toggleReviewer(langId: string, hasReviewer: boolean) {
    try {
      await fetch(`/api/languages/${langId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasLocalReviewer: !hasReviewer }),
      })
      mutateLangs()
    } catch {
      setActionMessage('Error updating reviewer status')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration for Content Repurposing</p>
      </div>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.startsWith('Error') ? 'error' : 'success'}`}>
          {actionMessage}
        </div>
      )}

      <div className="settings-grid">
        {/* System Settings */}
        <Card title="System Settings" subtitle="Key-value configuration">
          {!settingsData ? (
            <p className="empty-text">Loading settings...</p>
          ) : (
            <div className="settings-list">
              {settingsData.settings.map((s: any) => (
                <div key={s.key} className="setting-item">
                  <div className="setting-header">
                    <span className="setting-key">{s.key}</span>
                    {s.description && <span className="setting-desc">{s.description}</span>}
                  </div>
                  <input
                    type={s.key.toLowerCase().includes('key') || s.key.toLowerCase().includes('secret') ? 'password' : 'text'}
                    value={settingsEdits[s.key] !== undefined ? settingsEdits[s.key] : s.value}
                    onChange={(e) => handleSettingChange(s.key, e.target.value)}
                    className="setting-input"
                  />
                </div>
              ))}
              <button className="save-btn" onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </Card>

        {/* Languages */}
        <Card title="Languages" subtitle="Translation target languages">
          {!langData ? (
            <p className="empty-text">Loading languages...</p>
          ) : (
            <div className="languages-list">
              {langData.languages.map((lang: any) => (
                <div key={lang.id} className="lang-item">
                  <div className="lang-header">
                    <div className="lang-info">
                      <span className="lang-name">{lang.name}</span>
                      {lang.nativeName && <span className="lang-native">({lang.nativeName})</span>}
                      <Badge variant="neutral" size="sm">{lang.code.toUpperCase()}</Badge>
                    </div>
                    <div className="lang-badges">
                      <Badge variant={lang.isActive ? 'success' : 'neutral'} size="sm">
                        {lang.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {lang.hasLocalReviewer && (
                        <Badge variant="purple" size="sm">Has Reviewer</Badge>
                      )}
                    </div>
                  </div>
                  <div className="lang-meta">
                    <span className="lang-stat">Priority: {lang.priority}</span>
                    <span className="lang-stat">Translations: {lang.totalTranslations}</span>
                  </div>
                  <div className="lang-actions">
                    <button
                      className={`action-btn ${lang.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => toggleLanguage(lang.id, lang.isActive)}
                    >
                      {lang.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className={`action-btn ${lang.hasLocalReviewer ? 'remove-reviewer' : 'add-reviewer'}`}
                      onClick={() => toggleReviewer(lang.id, lang.hasLocalReviewer)}
                    >
                      {lang.hasLocalReviewer ? 'Remove Reviewer' : 'Add Reviewer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pabbly Events */}
        <Card title="Pabbly Events" subtitle="Recent webhook event log">
          {!showPabblyEvents ? (
            <button className="load-btn" onClick={() => setShowPabblyEvents(true)}>
              Load Event Log
            </button>
          ) : !pabblyData ? (
            <p className="empty-text">Loading events...</p>
          ) : pabblyData.events.length === 0 ? (
            <p className="empty-text">No events recorded yet</p>
          ) : (
            <div className="events-list">
              {pabblyData.events.map((e: any) => (
                <div key={e.id} className="event-item">
                  <div className="event-header">
                    <Badge variant={e.direction === 'inbound' ? 'info' : 'orange'} size="sm">
                      {e.direction}
                    </Badge>
                    <span className="event-workflow">{e.workflowName}</span>
                    <Badge
                      variant={e.status === 'sent' || e.status === 'received' ? 'success' : 'error'}
                      size="sm"
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <div className="event-meta">
                    <span className="event-type">{e.eventType}</span>
                    <span className="event-date">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* System Info */}
        <Card title="System Info">
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Dashboard</span>
              <span className="info-value">Content Repurposing v1.0.0</span>
            </div>
            <div className="info-row">
              <span className="info-label">Pillar</span>
              <span className="info-value">2 — Content Repurposing + Translation</span>
            </div>
            <div className="info-row">
              <span className="info-label">Port</span>
              <span className="info-value">3002</span>
            </div>
            <div className="info-row">
              <span className="info-label">Database</span>
              <span className="info-value">SQLite (Prisma ORM)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Transcription</span>
              <span className="info-value">ElevenLabs Scribe</span>
            </div>
            <div className="info-row">
              <span className="info-label">AI Generation</span>
              <span className="info-value">Claude Haiku</span>
            </div>
            <div className="info-row">
              <span className="info-label">Image Generation</span>
              <span className="info-value">FAL.AI (FLUX/Recraft)</span>
            </div>
            <div className="info-row">
              <span className="info-label">License</span>
              <span className="info-value">CC0-1.0 (Public Domain)</span>
            </div>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
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
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        .action-msg {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .action-msg.success { background: #d1fae5; color: #065f46; }
        .action-msg.error { background: #fee2e2; color: #991b1b; }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        /* Settings */
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .setting-header {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .setting-key {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          font-family: monospace;
        }
        .setting-desc {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .setting-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: monospace;
        }
        .save-btn {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Languages */
        .languages-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .lang-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .lang-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lang-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lang-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }
        .lang-native {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .lang-badges {
          display: flex;
          gap: 0.5rem;
        }
        .lang-meta {
          display: flex;
          gap: 1rem;
        }
        .lang-stat {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .lang-actions {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .activate { background: #d1fae5; color: #065f46; }
        .deactivate { background: #fee2e2; color: #991b1b; }
        .add-reviewer { background: #ede9fe; color: #5b21b6; }
        .remove-reviewer { background: #f3f4f6; color: #374151; }

        /* Pabbly Events */
        .load-btn {
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          width: 100%;
        }
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .event-item {
          padding: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .event-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .event-workflow {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
          flex: 1;
        }
        .event-meta {
          display: flex;
          gap: 1rem;
        }
        .event-type {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .event-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Info */
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .info-label {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .info-value {
          font-size: 0.875rem;
          color: #111827;
          font-weight: 500;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 1rem;
          margin: 0;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
