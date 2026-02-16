// GET /api/dashboard/stats
// Returns real-time dashboard statistics

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch all data in parallel
    const [
      totalContent,
      activeContent,
      completedContent,
      failedContent,
      todayMetric,
      yesterdayMetric,
      platformHealth,
      recentAlerts,
    ] = await Promise.all([
      prisma.contentItem.count(),
      prisma.contentItem.count({ where: { status: 'in_progress' } }),
      prisma.contentItem.count({ where: { status: 'completed' } }),
      prisma.contentItem.count({ where: { status: 'failed' } }),
      prisma.pipelineMetric.findFirst({
        where: { date: { gte: today } },
      }),
      prisma.pipelineMetric.findFirst({
        where: {
          date: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today,
          },
        },
      }),
      prisma.platformHealth.findMany(),
      prisma.alert.count({ where: { isRead: false } }),
    ])

    // Calculate platform stats
    const healthyPlatforms = platformHealth.filter((p) => p.status === 'healthy').length
    const totalPlatforms = platformHealth.length

    // Calculate trends (today vs yesterday)
    const postsTrend = yesterdayMetric
      ? ((todayMetric?.totalPosts || 0) - yesterdayMetric.totalPosts) /
        Math.max(yesterdayMetric.totalPosts, 1)
      : 0

    const successRateTrend = yesterdayMetric
      ? (todayMetric?.successRate || 0) - yesterdayMetric.successRate
      : 0

    return NextResponse.json({
      content: {
        total: totalContent,
        active: activeContent,
        completed: completedContent,
        failed: failedContent,
      },
      today: {
        posts: todayMetric?.totalPosts || 0,
        successful: todayMetric?.successfulPosts || 0,
        failed: todayMetric?.failedPosts || 0,
        successRate: todayMetric?.successRate || 0,
        tier1: todayMetric?.tier1Posts || 0,
        tier2: todayMetric?.tier2Posts || 0,
        tier3: todayMetric?.tier3Posts || 0,
      },
      platforms: {
        healthy: healthyPlatforms,
        total: totalPlatforms,
        healthPercentage: totalPlatforms > 0 ? (healthyPlatforms / totalPlatforms) * 100 : 0,
      },
      alerts: {
        unread: recentAlerts,
      },
      trends: {
        posts: {
          value: Math.round(Math.abs(postsTrend) * 100),
          direction: postsTrend > 0 ? 'up' : postsTrend < 0 ? 'down' : 'neutral',
        },
        successRate: {
          value: Math.round(Math.abs(successRateTrend)),
          direction: successRateTrend > 0 ? 'up' : successRateTrend < 0 ? 'down' : 'neutral',
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
