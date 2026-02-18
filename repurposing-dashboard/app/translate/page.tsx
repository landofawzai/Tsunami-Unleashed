'use client'

// Translator Portal — Language Picker
// Mobile-first landing page showing available languages with translation counts

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const NATIVE_NAMES: Record<string, string> = {
  hi: 'हिन्दी',
  bn: 'বাংলা',
  mai: 'मैथिली',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  ur: 'اردو',
  ar: 'العربية',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  sw: 'Kiswahili',
}

export default function TranslateHomePage() {
  const router = useRouter()
  const { data: langData } = useSWR('/api/languages', fetcher)

  // Check localStorage for remembered language
  useEffect(() => {
    const saved = localStorage.getItem('translate_lang')
    if (saved && langData?.languages?.some((l: { code: string; isActive: boolean }) => l.code === saved && l.isActive)) {
      router.replace(`/translate/${saved}`)
    }
  }, [langData, router])

  const languages = (langData?.languages || []).filter((l: { isActive: boolean; code: string }) => l.isActive && l.code !== 'en')

  return (
    <div className="picker-page">
      <div className="picker-hero">
        <h1 className="picker-title">Choose Your Language</h1>
        <p className="picker-subtitle">
          Help translate content for your community
        </p>
      </div>

      {!langData ? (
        <div className="picker-loading">Loading languages...</div>
      ) : languages.length === 0 ? (
        <div className="picker-empty">No translation languages configured yet.</div>
      ) : (
        <div className="picker-grid">
          {languages.map((lang: { id: string; code: string; name: string; nativeName?: string; totalTranslations: number }) => (
            <button
              key={lang.id}
              className="lang-card"
              onClick={() => {
                localStorage.setItem('translate_lang', lang.code)
                router.push(`/translate/${lang.code}`)
              }}
            >
              <div className="lang-card-native">
                {lang.nativeName || NATIVE_NAMES[lang.code] || lang.code.toUpperCase()}
              </div>
              <div className="lang-card-name">{lang.name}</div>
              <div className="lang-card-count">
                {lang.totalTranslations} translations
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .picker-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        .picker-hero {
          text-align: center;
          margin-bottom: 2rem;
        }
        .picker-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }
        .picker-subtitle {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
        }
        .picker-loading,
        .picker-empty {
          text-align: center;
          color: #9ca3af;
          padding: 3rem 1rem;
          font-size: 0.9rem;
        }
        .picker-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .lang-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          -webkit-tap-highlight-color: transparent;
        }
        .lang-card:active {
          transform: scale(0.97);
        }
        .lang-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }
        .lang-card-native {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .lang-card-name {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 500;
        }
        .lang-card-count {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        @media (min-width: 768px) {
          .picker-page { padding: 2rem; }
          .picker-title { font-size: 2rem; }
          .picker-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
