// GET /api/feeds
// Returns RSS feed data

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const feeds = await prisma.rssFeed.findMany({
      orderBy: [{ tier: 'asc' }, { feedName: 'asc' }],
    })

    const stats = {
      total: feeds.length,
      tier1: feeds.filter((f) => f.tier === 1).length,
      tier2: feeds.filter((f) => f.tier === 2).length,
      active: feeds.filter((f) => f.isActive).length,
    }

    return NextResponse.json({ feeds, stats })
  } catch (error) {
    console.error('Error fetching feeds:', error)
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 })
  }
}
