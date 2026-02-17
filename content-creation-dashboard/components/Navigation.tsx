'use client'

import Link from 'next/link'

export function Navigation() {
  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
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
          Content Creation
        </Link>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/content" label="Content" />
          <NavLink href="/calendar" label="Calendar" />
          <NavLink href="/series" label="Series" />
          <NavLink href="/reviews" label="Reviews" />
          <NavLink href="/library" label="Library" />
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
