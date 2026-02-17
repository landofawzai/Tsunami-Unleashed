'use client'

// Translations Page — Review queue with filters

import { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange'; label: string }> = {
  ai_draft: { variant: 'neutral', label: 'AI Draft' },
  review_pending: { variant: 'warning', label: 'Review Pending' },
  reviewed: { variant: 'info', label: 'Reviewed' },
  approved: { variant: 'success', label: 'Approved' },
  failed: { variant: 'error', label: 'Failed' },
}

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  mai: 'Maithili',
  en: 'English',
}

export default function TranslationsPage() {
  const [search, setSearch] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [reviewPass, setReviewPass] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (targetLanguage) params.set('targetLanguage', targetLanguage)
  if (status) params.set('status', status)
  if (reviewPass) params.set('reviewPass', reviewPass)

  const { data } = useSWR(`/api/translations?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Translations</h1>
          <p className="page-subtitle">
            {data?.total || 0} translations — 3-pass review: AI draft → local review → theological
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search translations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input search-input"
        />
        <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="filter-input">
          <option value="">All Languages</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
          <option value="mai">Maithili</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-input">
          <option value="">All Status</option>
          <option value="ai_draft">AI Draft</option>
          <option value="review_pending">Review Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="failed">Failed</option>
        </select>
        <select value={reviewPass} onChange={(e) => setReviewPass(e.target.value)} className="filter-input">
          <option value="">All Passes</option>
          <option value="1">Pass 1 (AI)</option>
          <option value="2">Pass 2 (Local)</option>
          <option value="3">Pass 3 (Theological)</option>
        </select>
      </div>

      {/* Translations List */}
      <div className="translations-grid">
        {!data ? (
          <Card><p className="empty-text">Loading translations...</p></Card>
        ) : data.translations.length === 0 ? (
          <Card><p className="empty-text">No translations found.</p></Card>
        ) : (
          data.translations.map((t: any) => {
            const statusBadge = STATUS_BADGES[t.status] || STATUS_BADGES.ai_draft
            return (
              <a key={t.id} href={`/translations/${t.id}`} className="translation-link">
                <Card>
                  <div className="translation-card">
                    <div className="translation-top">
                      <div className="translation-header">
                        <span className="lang-badge">{t.targetLanguage.toUpperCase()}</span>
                        <h3 className="translation-title">{t.title}</h3>
                      </div>
                      <div className="translation-badges">
                        <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                        <Badge variant="neutral" size="sm">Pass {t.reviewPass}/3</Badge>
                        {t.sentToDistribution && <Badge variant="success" size="sm">Distributed</Badge>}
                      </div>
                    </div>
                    <p className="translation-preview">
                      {t.body.slice(0, 120)}{t.body.length > 120 ? '...' : ''}
                    </p>
                    <div className="translation-footer">
                      <span className="translation-source">
                        {t.derivative?.title || t.parentContentId}
                      </span>
                      <span className="translation-lang">
                        {LANG_NAMES[t.sourceLanguage] || t.sourceLanguage} → {LANG_NAMES[t.targetLanguage] || t.targetLanguage}
                      </span>
                    </div>
                  </div>
                </Card>
              </a>
            )
          })
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <span>Page {data.page} of {data.totalPages} ({data.total} total)</span>
        </div>
      )}

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
        .filters {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .filter-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
        }
        .translations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1rem;
        }
        .translation-link {
          text-decoration: none;
          color: inherit;
        }
        .translation-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .translation-top {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .translation-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .lang-badge {
          font-size: 0.875rem;
          font-weight: 700;
          color: #8b5cf6;
          background: #ede9fe;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          min-width: 2.5rem;
          text-align: center;
        }
        .translation-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .translation-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .translation-preview {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .translation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .translation-source {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .translation-lang {
          font-size: 0.75rem;
          color: #8b5cf6;
        }
        .empty-text {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        .pagination {
          text-align: center;
          padding: 1.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }
        @media (max-width: 640px) {
          .page { padding: 1rem; }
          .translations-grid { grid-template-columns: 1fr; }
          .filters { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
