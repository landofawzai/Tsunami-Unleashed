// Dashboard Stats API
// GET: Overview statistics for home page

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [
      totalContent,
      statusCounts,
      typeCounts,
      mediaCounts,
      totalSeries,
      pendingReviews,
      pendingTasks,
      overdueTasks,
      totalSent,
      recentContent,
      upcomingDeadlines,
      unreadAlerts,
    ] = await Promise.all([
      prisma.contentItem.count(),
      prisma.contentItem.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.contentItem.groupBy({ by: ['contentType'], _count: { _all: true } }),
      prisma.contentItem.groupBy({ by: ['mediaType'], _count: { _all: true } }),
      prisma.series.count({ where: { status: 'active' } }),
      prisma.contentItem.count({ where: { status: 'review' } }),
      prisma.productionTask.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
      prisma.productionTask.count({
        where: {
          status: { in: ['pending', 'in_progress'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.contentItem.count({ where: { sentToRepurposing: true } }),
      prisma.contentItem.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, contentId: true, title: true, contentType: true, mediaType: true, status: true, assignedTo: true, createdAt: true },
      }),
      prisma.calendarEntry.findMany({
        where: { date: { gte: new Date() }, isCompleted: false },
        take: 5,
        orderBy: { date: 'asc' },
        include: {
          contentItem: { select: { id: true, title: true } },
        },
      }),
      prisma.alert.count({ where: { isRead: false } }),
    ])

    const statusMap: Record<string, number> = {}
    statusCounts.forEach((s) => { statusMap[s.status] = s._count._all })

    const typeMap: Record<string, number> = {}
    typeCounts.forEach((t) => { typeMap[t.contentType] = t._count._all })

    const mediaMap: Record<string, number> = {}
    mediaCounts.forEach((m) => { mediaMap[m.mediaType] = m._count._all })

    const inProduction = (statusMap['drafting'] || 0) + (statusMap['recording'] || 0) + (statusMap['editing'] || 0)

    return NextResponse.json({
      totalContent,
      inProduction,
      pendingReviews,
      totalSent,
      pendingTasks,
      overdueTasks,
      totalSeries,
      unreadAlerts,
      statusBreakdown: statusMap,
      typeBreakdown: typeMap,
      mediaBreakdown: mediaMap,
      recentContent,
      upcomingDeadlines,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
