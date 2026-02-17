import { NextResponse } from 'next/server'
import { PILLARS } from '@/lib/pillar-config'

export const dynamic = 'force-dynamic'

interface PillarResult {
  status: 'up' | 'down' | 'not_built'
  responseMs: number | null
  data: Record<string, unknown> | null
}

export async function GET() {
  const timeout = 2000

  const results: Record<string, PillarResult> = {}

  const fetches = PILLARS.map(async (pillar) => {
    if (!pillar.enabled) {
      results[pillar.id] = { status: 'not_built', responseMs: null, data: null }
      return
    }

    const start = Date.now()
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(`${pillar.internalUrl}${pillar.statsEndpoint}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)

      const responseMs = Date.now() - start

      if (!res.ok) {
        results[pillar.id] = { status: 'down', responseMs, data: null }
        return
      }

      const data = await res.json()
      results[pillar.id] = { status: 'up', responseMs, data }
    } catch {
      results[pillar.id] = { status: 'down', responseMs: Date.now() - start, data: null }
    }
  })

  await Promise.allSettled(fetches)

  // Build summary
  let pillarsUp = 0
  let pillarsDown = 0
  let pillarsNotBuilt = 0
  let totalContent = 0
  let totalDerivatives = 0
  let totalDistributed = 0
  let totalMessages = 0
  let totalAlerts = 0

  for (const [id, result] of Object.entries(results)) {
    if (result.status === 'up') pillarsUp++
    else if (result.status === 'down') pillarsDown++
    else pillarsNotBuilt++

    if (result.data) {
      if (id === 'creation') {
        totalContent += Number(result.data.totalContent || 0)
        totalAlerts += Number(result.data.unreadAlerts || 0)
      }
      if (id === 'repurposing') {
        totalDerivatives += Number(result.data.totalDerivatives || result.data.totalOutputs || 0)
        totalAlerts += Number(result.data.unreadAlerts || 0)
      }
      if (id === 'distribution') {
        totalDistributed += Number(result.data.totalDistributed || result.data.postsToday || 0)
        totalAlerts += Number(result.data.unreadAlerts || 0)
      }
      if (id === 'communication') {
        totalMessages += Number(result.data.totalMessages || result.data.messagesSent || 0)
        totalAlerts += Number(result.data.unreadAlerts || 0)
      }
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    pillars: results,
    summary: {
      pillarsUp,
      pillarsDown,
      pillarsNotBuilt,
      totalContent,
      totalDerivatives,
      totalDistributed,
      totalMessages,
      totalAlerts,
    },
  })
}
