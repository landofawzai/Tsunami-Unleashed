// GET /api/platforms
// Returns platform health data

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const platforms = await prisma.platformHealth.findMany({
      orderBy: [{ tier: 'asc' }, { platform: 'asc' }],
    })

    const stats = {
      total: platforms.length,
      healthy: platforms.filter((p) => p.status === 'healthy').length,
      degraded: platforms.filter((p) => p.status === 'degraded').length,
      down: platforms.filter((p) => p.status === 'down').length,
    }

    return NextResponse.json({ platforms, stats })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
  }
}
