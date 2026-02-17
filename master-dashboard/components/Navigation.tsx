'use client'

import Link from 'next/link'
import { ENABLED_PILLARS } from '@/lib/pillar-config'

export function Navigation() {
  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
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
          Tsunami Unleashed
        </Link>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/status" label="Status" />
          <NavLink href="/pipeline" label="Pipeline" />
          <NavLink href="/settings" label="Settings" />

          <span
            style={{
              width: '1px',
              height: '24px',
              background: 'rgba(255,255,255,0.3)',
              margin: '0 0.25rem',
            }}
          />

          {ENABLED_PILLARS.map((p) => (
            <a
              key={p.id}
              href={p.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.05)',
                borderLeft: `3px solid ${p.color}`,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            >
              P{p.number}
            </a>
          ))}
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
