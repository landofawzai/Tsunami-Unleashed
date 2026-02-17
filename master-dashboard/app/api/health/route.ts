import { NextResponse } from 'next/server'
import { PILLARS } from '@/lib/pillar-config'

export const dynamic = 'force-dynamic'

interface HealthResult {
  status: 'up' | 'down' | 'not_built'
  responseMs: number | null
  lastChecked: string
}

export async function GET() {
  const timeout = 2000
  const results: Record<string, HealthResult> = {}

  const fetches = PILLARS.map(async (pillar) => {
    if (!pillar.enabled) {
      results[pillar.id] = {
        status: 'not_built',
        responseMs: null,
        lastChecked: new Date().toISOString(),
      }
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

      results[pillar.id] = {
        status: res.ok ? 'up' : 'down',
        responseMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      }
    } catch {
      results[pillar.id] = {
        status: 'down',
        responseMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      }
    }
  })

  await Promise.allSettled(fetches)

  const up = Object.values(results).filter((r) => r.status === 'up').length
  const down = Object.values(results).filter((r) => r.status === 'down').length
  const notBuilt = Object.values(results).filter((r) => r.status === 'not_built').length

  return NextResponse.json({
    overall: down === 0 ? 'healthy' : 'degraded',
    pillars: results,
    summary: { up, down, notBuilt, total: PILLARS.length },
  })
}
