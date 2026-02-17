import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Communication Dashboard | Tsunami Unleashed',
  description: 'Outbound Multi-Channel Messaging for Global Ministry Automation',
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
