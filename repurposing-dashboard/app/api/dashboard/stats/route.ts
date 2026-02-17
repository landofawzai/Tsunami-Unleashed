// Dashboard Stats API
// Returns overview statistics for the repurposing dashboard

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Today's metrics
    const todayMetric = await prisma.repurposingMetric.findUnique({
      where: { date: today },
    })

    // Source counts by status
    const [pendingSources, processingSources, readySources, failedSources] =
      await Promise.all([
        prisma.sourceContent.count({ where: { status: 'pending' } }),
        prisma.sourceContent.count({ where: { status: 'processing' } }),
        prisma.sourceContent.count({ where: { status: 'ready' } }),
        prisma.sourceContent.count({ where: { status: 'failed' } }),
      ])

    const totalSources = pendingSources + processingSources + readySources + failedSources

    // Derivative counts by type
    const totalDerivatives = await prisma.derivative.count()
    const derivativesByType = await prisma.derivative.groupBy({
      by: ['derivativeType'],
      _count: { id: true },
    })
    const sentToDistribution = await prisma.derivative.count({
      where: { sentToDistribution: true },
    })

    // Translation stats
    const totalTranslations = await prisma.translation.count()
    const translationsByStatus = await prisma.translation.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const translationsByLanguage = await prisma.translation.groupBy({
      by: ['targetLanguage'],
      _count: { id: true },
    })

    // Active languages
    const activeLanguages = await prisma.languageConfig.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        nativeName: true,
        totalTranslations: true,
        hasLocalReviewer: true,
      },
      orderBy: { priority: 'asc' },
    })

    // Job stats
    const [queuedJobs, processingJobs, completedJobs, failedJobs] =
      await Promise.all([
        prisma.processingJob.count({ where: { status: 'queued' } }),
        prisma.processingJob.count({ where: { status: 'processing' } }),
        prisma.processingJob.count({ where: { status: 'completed' } }),
        prisma.processingJob.count({ where: { status: 'failed' } }),
      ])

    // Unread alerts
    const unreadAlerts = await prisma.alert.count({
      where: { isRead: false },
    })
    const criticalAlerts = await prisma.alert.count({
      where: { isRead: false, severity: 'critical' },
    })

    // Recent sources (last 5)
    const recentSources = await prisma.sourceContent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        contentId: true,
        title: true,
        contentType: true,
        mediaType: true,
        status: true,
        createdAt: true,
        _count: { select: { derivatives: true } },
      },
    })

    // Pending reviews (translations awaiting review)
    const pendingReviews = await prisma.translation.count({
      where: { status: 'review_pending' },
    })

    // Derivative queue status
    const activeQueues = await prisma.derivativeQueue.count({
      where: { status: { in: ['pending', 'processing'] } },
    })

    return NextResponse.json({
      today: {
        sourcesIngested: todayMetric?.sourcesIngested || 0,
        derivativesGenerated: todayMetric?.derivativesGenerated || 0,
        translationsCompleted: todayMetric?.translationsCompleted || 0,
        jobsProcessed: todayMetric?.jobsProcessed || 0,
        jobsFailed: todayMetric?.jobsFailed || 0,
        aiTokensUsed: todayMetric?.aiTokensUsed || 0,
        scribeMinutes: todayMetric?.scribeMinutes || 0,
        imagesGenerated: todayMetric?.imagesGenerated || 0,
        sentToDistribution: todayMetric?.sentToDistribution || 0,
      },
      sources: {
        total: totalSources,
        pending: pendingSources,
        processing: processingSources,
        ready: readySources,
        failed: failedSources,
      },
      derivatives: {
        total: totalDerivatives,
        sentToDistribution,
        byType: Object.fromEntries(
          derivativesByType.map((d) => [d.derivativeType, d._count.id])
        ),
      },
      translations: {
        total: totalTranslations,
        byStatus: Object.fromEntries(
          translationsByStatus.map((t) => [t.status, t._count.id])
        ),
        byLanguage: Object.fromEntries(
          translationsByLanguage.map((t) => [t.targetLanguage, t._count.id])
        ),
        pendingReviews,
      },
      languages: activeLanguages,
      jobs: {
        queued: queuedJobs,
        processing: processingJobs,
        completed: completedJobs,
        failed: failedJobs,
        total: queuedJobs + processingJobs + completedJobs + failedJobs,
      },
      alerts: {
        unread: unreadAlerts,
        critical: criticalAlerts,
      },
      queues: {
        active: activeQueues,
      },
      recentSources,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
