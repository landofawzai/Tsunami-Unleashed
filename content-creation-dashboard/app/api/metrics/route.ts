// Metrics API
// GET: Daily rollup metrics

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const metrics = await prisma.creationMetric.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    })

    // Compute totals
    const totals = metrics.reduce(
      (acc, m) => ({
        contentPlanned: acc.contentPlanned + m.contentPlanned,
        contentDrafted: acc.contentDrafted + m.contentDrafted,
        contentFinalized: acc.contentFinalized + m.contentFinalized,
        contentSent: acc.contentSent + m.contentSent,
        reviewsCompleted: acc.reviewsCompleted + m.reviewsCompleted,
        tasksCompleted: acc.tasksCompleted + m.tasksCompleted,
      }),
      { contentPlanned: 0, contentDrafted: 0, contentFinalized: 0, contentSent: 0, reviewsCompleted: 0, tasksCompleted: 0 }
    )

    return NextResponse.json({ metrics, totals, days })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
