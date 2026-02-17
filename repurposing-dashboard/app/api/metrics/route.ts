// Metrics API
// GET: Return repurposing metrics (daily rollups)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const metrics = await prisma.repurposingMetric.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    })

    // Totals
    const totals = metrics.reduce(
      (acc, m) => ({
        sourcesIngested: acc.sourcesIngested + m.sourcesIngested,
        derivativesGenerated: acc.derivativesGenerated + m.derivativesGenerated,
        translationsCompleted: acc.translationsCompleted + m.translationsCompleted,
        jobsProcessed: acc.jobsProcessed + m.jobsProcessed,
        jobsFailed: acc.jobsFailed + m.jobsFailed,
        aiTokensUsed: acc.aiTokensUsed + m.aiTokensUsed,
        scribeMinutes: acc.scribeMinutes + m.scribeMinutes,
        imagesGenerated: acc.imagesGenerated + m.imagesGenerated,
        sentToDistribution: acc.sentToDistribution + m.sentToDistribution,
      }),
      {
        sourcesIngested: 0,
        derivativesGenerated: 0,
        translationsCompleted: 0,
        jobsProcessed: 0,
        jobsFailed: 0,
        aiTokensUsed: 0,
        scribeMinutes: 0,
        imagesGenerated: 0,
        sentToDistribution: 0,
      }
    )

    // Language breakdown from most recent metric
    const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null
    let languageBreakdown = {}
    let derivativeBreakdown = {}
    if (latestMetric) {
      try {
        languageBreakdown = latestMetric.languageBreakdown ? JSON.parse(latestMetric.languageBreakdown) : {}
      } catch { /* empty */ }
      try {
        derivativeBreakdown = latestMetric.derivativeBreakdown ? JSON.parse(latestMetric.derivativeBreakdown) : {}
      } catch { /* empty */ }
    }

    // Real-time counts from database
    const [totalSources, totalDerivatives, totalTranslations] = await Promise.all([
      prisma.sourceContent.count(),
      prisma.derivative.count(),
      prisma.translation.count(),
    ])

    return NextResponse.json({
      metrics,
      totals,
      languageBreakdown,
      derivativeBreakdown,
      realtime: {
        totalSources,
        totalDerivatives,
        totalTranslations,
      },
      period: { days, since: since.toISOString() },
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to load metrics' },
      { status: 500 }
    )
  }
}
