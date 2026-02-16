import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distribution Dashboard | Tsunami Unleashed',
  description: '4-Tier Distribution Monitoring for Global Ministry Automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
