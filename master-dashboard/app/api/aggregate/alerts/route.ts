import { NextResponse } from 'next/server'
import { PILLARS } from '@/lib/pillar-config'

export const dynamic = 'force-dynamic'

interface PillarAlert {
  pillar: string
  pillarName: string
  pillarColor: string
  id?: number
  severity: string
  message: string
  type?: string
  createdAt?: string
  isRead?: boolean
  isResolved?: boolean
}

export async function GET() {
  const timeout = 2000
  const allAlerts: PillarAlert[] = []
  const totalByPillar: Record<string, number> = {}

  const fetches = PILLARS.filter((p) => p.enabled).map(async (pillar) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(`${pillar.internalUrl}${pillar.alertsEndpoint}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)

      if (!res.ok) {
        totalByPillar[pillar.id] = 0
        return
      }

      const data = await res.json()
      const alerts = Array.isArray(data.alerts) ? data.alerts : []

      totalByPillar[pillar.id] = alerts.length

      for (const alert of alerts) {
        allAlerts.push({
          pillar: pillar.id,
          pillarName: pillar.name,
          pillarColor: pillar.color,
          id: alert.id,
          severity: alert.severity || 'info',
          message: alert.message || '',
          type: alert.type,
          createdAt: alert.createdAt,
          isRead: alert.isRead,
          isResolved: alert.isResolved,
        })
      }
    } catch {
      totalByPillar[pillar.id] = 0
    }
  })

  await Promise.allSettled(fetches)

  // Sort by severity (critical first) then by createdAt (newest first)
  const severityOrder: Record<string, number> = { critical: 0, error: 1, warning: 2, info: 3 }
  allAlerts.sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 4
    const sb = severityOrder[b.severity] ?? 4
    if (sa !== sb) return sa - sb
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })

  return NextResponse.json({
    alerts: allAlerts,
    totalByPillar,
  })
}
