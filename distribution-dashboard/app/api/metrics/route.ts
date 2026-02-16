// GET /api/metrics
// Returns pipeline metrics with date range filtering

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)

    // Calculate date range
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Fetch metrics within date range
    const metrics = await prisma.pipelineMetric.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate summary statistics
    const summary = {
      totalPosts: metrics.reduce((sum, m) => sum + m.totalPosts, 0),
      successfulPosts: metrics.reduce((sum, m) => sum + m.successfulPosts, 0),
      failedPosts: metrics.reduce((sum, m) => sum + m.failedPosts, 0),
      avgSuccessRate:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
          : 0,
      tier1Posts: metrics.reduce((sum, m) => sum + m.tier1Posts, 0),
      tier2Posts: metrics.reduce((sum, m) => sum + m.tier2Posts, 0),
      tier3Posts: metrics.reduce((sum, m) => sum + m.tier3Posts, 0),
    }

    return NextResponse.json({
      metrics: metrics.map((m) => ({
        date: m.date,
        totalPosts: m.totalPosts,
        successfulPosts: m.successfulPosts,
        failedPosts: m.failedPosts,
        successRate: m.successRate,
        tier1Posts: m.tier1Posts,
        tier2Posts: m.tier2Posts,
        tier3Posts: m.tier3Posts,
      })),
      summary,
      dateRange: {
        start: startDate,
        end: endDate,
        days,
      },
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
