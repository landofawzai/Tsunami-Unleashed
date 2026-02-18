'use client'

// Translator Portal — Translation Queue for a Language
// Mobile-first: single column cards, filter tabs, pull-to-refresh

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useState, useEffect } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi', bn: 'Bengali', mai: 'Maithili', ta: 'Tamil',
  te: 'Telugu', ur: 'Urdu', ar: 'Arabic', zh: 'Chinese',
  es: 'Spanish', fr: 'French', pt: 'Portuguese', sw: 'Swahili',
}

const NATIVE_NAMES: Record<string, string> = {
  hi: 'हिन्दी', bn: 'বাংলা', mai: 'मैथिली', ta: 'தமிழ்',
  te: 'తెలుగు', ur: 'اردو', ar: 'العربية', zh: '中文',
  es: 'Español', fr: 'Français', pt: 'Português', sw: 'Kiswahili',
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ai_draft: { bg: '#f3f4f6', text: '#374151', label: 'AI Draft' },
  review_pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  reviewed: { bg: '#dbeafe', text: '#1e40af', label: 'Reviewed' },
  approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
  failed: { bg: '#fee2e2', text: '#991b1b', label: 'Failed' },
}

type FilterTab = 'needs_work' | 'in_review' | 'approved' | 'all'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'needs_work', label: 'Needs Work' },
  { id: 'in_review', label: 'In Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'all', label: 'All' },
]

export default function TranslationQueuePage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string
  const [filter, setFilter] = useState<FilterTab>('needs_work')
  const [page, setPage] = useState(1)

  // Remember this language
  useEffect(() => {
    localStorage.setItem('translate_lang', lang)
  }, [lang])

  const statusParam = filter === 'all' ? '' : `&status=${filter}`
  const { data, isLoading } = useSWR(
    `/api/translate/translations?lang=${lang}&page=${page}${statusParam}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const translations = data?.translations || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const langName = LANG_NAMES[lang] || lang.toUpperCase()
  const nativeName = NATIVE_NAMES[lang] || ''

  return (
    <div className="queue-page">
      {/* Header */}
      <div className="queue-header">
        <button className="back-btn" onClick={() => {
          localStorage.removeItem('translate_lang')
          router.push('/translate')
        }}>
          ←
        </button>
        <div className="header-text">
          <h1 className="header-lang">{langName}</h1>
          {nativeName && <span className="header-native">{nativeName}</span>}
        </div>
        <div className="header-count">{total}</div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => { setFilter(tab.id); setPage(1) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Translation List */}
      {isLoading ? (
        <div className="queue-loading">Loading translations...</div>
      ) : translations.length === 0 ? (
        <div className="queue-empty">
          {filter === 'needs_work' ? 'No translations need work right now.' :
           filter === 'in_review' ? 'No translations in review.' :
           filter === 'approved' ? 'No approved translations yet.' :
           'No translations found.'}
        </div>
      ) : (
        <div className="queue-list">
          {translations.map((t: {
            id: string
            title: string
            bodyPreview: string
            status: string
            reviewPass: number
            derivative?: { derivativeType: string }
            lastEditedBy?: string
          }) => {
            const statusInfo = STATUS_COLORS[t.status] || STATUS_COLORS.ai_draft
            return (
              <button
                key={t.id}
                className="translation-card"
                onClick={() => router.push(`/translate/${lang}/${t.id}`)}
              >
                <div className="card-top">
                  <h3 className="card-title">{t.title}</h3>
                  <div className="card-badges">
                    <span className="status-badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                      {statusInfo.label}
                    </span>
                    <span className="pass-badge">
                      Pass {t.reviewPass}/3
                    </span>
                  </div>
                </div>
                <p className="card-preview">{t.bodyPreview}</p>
                <div className="card-meta">
                  {t.derivative?.derivativeType && (
                    <span className="meta-type">
                      {t.derivative.derivativeType.replace(/_/g, ' ')}
                    </span>
                  )}
                  {t.lastEditedBy && (
                    <span className="meta-editor">
                      Edited by {t.lastEditedBy}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            {page} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .queue-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 0 2rem;
        }

        /* Header */
        .queue-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          -webkit-tap-highlight-color: transparent;
        }
        .back-btn:active { background: #f3f4f6; }
        .header-text { flex: 1; }
        .header-lang {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .header-native {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .header-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #8b5cf6;
        }

        /* Filter Tabs */
        .filter-tabs {
          display: flex;
          gap: 0.375rem;
          padding: 0.75rem 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .filter-tabs::-webkit-scrollbar { display: none; }
        .filter-tab {
          padding: 0.5rem 0.875rem;
          border: none;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          background: #f3f4f6;
          color: #6b7280;
          min-height: 36px;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.2s, color 0.2s;
        }
        .filter-tab.active {
          background: #8b5cf6;
          color: white;
        }

        /* List */
        .queue-loading,
        .queue-empty {
          text-align: center;
          color: #9ca3af;
          padding: 3rem 1rem;
          font-size: 0.9rem;
        }
        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Card */
        .translation-card {
          display: block;
          width: 100%;
          text-align: left;
          background: white;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          padding: 1rem;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.15s;
        }
        .translation-card:active {
          background: #f9fafb;
        }
        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
        }
        .card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
          line-height: 1.3;
        }
        .card-badges {
          display: flex;
          gap: 0.375rem;
          flex-shrink: 0;
        }
        .status-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .pass-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
          white-space: nowrap;
        }
        .card-preview {
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          overflow-wrap: break-word;
        }
        .card-meta {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .meta-type {
          font-size: 0.7rem;
          color: #9ca3af;
          text-transform: capitalize;
        }
        .meta-editor {
          font-size: 0.7rem;
          color: #9ca3af;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
        }
        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          min-height: 44px;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-info {
          font-size: 0.85rem;
          color: #6b7280;
        }

        @media (min-width: 768px) {
          .queue-page { padding: 0 1rem 2rem; }
          .queue-header { border-radius: 12px 12px 0 0; margin-top: 1rem; }
          .translation-card:hover { background: #f9fafb; }
        }
      `}</style>
    </div>
  )
}
