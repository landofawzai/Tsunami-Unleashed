'use client'

// Translator Portal Layout — Mobile-first, minimal navigation
// Completely separate from the admin dashboard navigation

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TranslateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: authData } = useSWR('/api/translate/auth/me', fetcher)
  const user = authData?.user

  const isLoginPage = pathname === '/translate/login'

  return (
    <div className="portal">
      {/* Minimal header */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <Link href="/translate" className="portal-logo">
            Translation Portal
          </Link>
          <div className="portal-header-right">
            {user ? (
              <div className="portal-user">
                <span className="portal-user-name">{user.displayName}</span>
                <span className="portal-user-role">{user.role}</span>
              </div>
            ) : !isLoginPage ? (
              <Link href="/translate/login" className="portal-login-link">
                Sign In
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {children}

      <style jsx>{`
        .portal {
          min-height: 100vh;
          background: #f9fafb;
        }
        .portal-header {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          padding: 0.75rem 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .portal-header-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .portal-logo {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }
        .portal-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .portal-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .portal-user-name {
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .portal-user-role {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .portal-login-link {
          color: white;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  )
}
