'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  // Hide dashboard nav on translator portal pages
  if (pathname.startsWith('/translate')) return null

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
        padding: '1rem 2rem',
        marginBottom: '0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Content Repurposing
        </Link>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/sources" label="Sources" />
          <NavLink href="/derivatives" label="Derivatives" />
          <NavLink href="/translations" label="Translations" />
          <NavLink href="/jobs" label="Jobs" />
          <NavLink href="/templates" label="Templates" />
          <NavLink href="/metrics" label="Metrics" />
          <NavLink href="/alerts" label="Alerts" />
          <NavLink href="/settings" label="Settings" />
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'background 0.2s',
        background: 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {label}
    </Link>
  )
}
