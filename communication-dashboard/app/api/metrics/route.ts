// Metrics API
// GET: Communication metrics with date range filter

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Daily metrics
    const metrics = await prisma.communicationMetric.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    })

    // Aggregate totals
    const totals = metrics.reduce(
      (acc, m) => ({
        messagesSent: acc.messagesSent + m.messagesSent,
        messagesDelivered: acc.messagesDelivered + m.messagesDelivered,
        messagesFailed: acc.messagesFailed + m.messagesFailed,
        messagesOpened: acc.messagesOpened + m.messagesOpened,
        campaignsSent: acc.campaignsSent + m.campaignsSent,
        urgentAlertsSent: acc.urgentAlertsSent + m.urgentAlertsSent,
        prayerRequestsSent: acc.prayerRequestsSent + m.prayerRequestsSent,
      }),
      {
        messagesSent: 0,
        messagesDelivered: 0,
        messagesFailed: 0,
        messagesOpened: 0,
        campaignsSent: 0,
        urgentAlertsSent: 0,
        prayerRequestsSent: 0,
      }
    )

    const deliveryRate =
      totals.messagesSent > 0
        ? (totals.messagesDelivered / totals.messagesSent) * 100
        : 0
    const openRate =
      totals.messagesDelivered > 0
        ? (totals.messagesOpened / totals.messagesDelivered) * 100
        : 0

    // Channel breakdown (aggregate from all days)
    const channelBreakdown: Record<string, number> = {}
    const regionBreakdown: Record<string, number> = {}
    for (const m of metrics) {
      if (m.channelBreakdown) {
        const channels = JSON.parse(m.channelBreakdown)
        for (const [ch, count] of Object.entries(channels)) {
          channelBreakdown[ch] = (channelBreakdown[ch] || 0) + (count as number)
        }
      }
      if (m.regionBreakdown) {
        const regions = JSON.parse(m.regionBreakdown)
        for (const [reg, count] of Object.entries(regions)) {
          regionBreakdown[reg] = (regionBreakdown[reg] || 0) + (count as number)
        }
      }
    }

    // Per-channel delivery stats from DeliveryLog
    const channelStats = await prisma.deliveryLog.groupBy({
      by: ['channel', 'status'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
      },
    })

    const channelPerformance: Record<string, { sent: number; delivered: number; failed: number; opened: number }> = {}
    for (const stat of channelStats) {
      if (!channelPerformance[stat.channel]) {
        channelPerformance[stat.channel] = { sent: 0, delivered: 0, failed: 0, opened: 0 }
      }
      const p = channelPerformance[stat.channel]
      if (stat.status === 'sent') p.sent += stat._count.id
      if (stat.status === 'delivered') p.delivered += stat._count.id
      if (stat.status === 'failed') p.failed += stat._count.id
      if (stat.status === 'opened') p.opened += stat._count.id
    }

    // Top failure reasons
    const failures = await prisma.deliveryLog.groupBy({
      by: ['errorMessage'],
      _count: { id: true },
      where: {
        status: 'failed',
        errorMessage: { not: null },
        createdAt: { gte: startDate },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    return NextResponse.json({
      period: { days, startDate },
      totals: { ...totals, deliveryRate, openRate },
      dailyMetrics: metrics,
      channelBreakdown,
      regionBreakdown,
      channelPerformance,
      topFailures: failures.map((f) => ({
        reason: f.errorMessage,
        count: f._count.id,
      })),
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to load metrics' },
      { status: 500 }
    )
  }
}
