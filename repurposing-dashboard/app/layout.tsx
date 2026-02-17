import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Content Repurposing | Tsunami Unleashed',
  description: 'Content Repurposing + Translation Dashboard for Global Ministry Automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
