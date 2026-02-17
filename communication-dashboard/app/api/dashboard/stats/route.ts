// Dashboard Stats API
// Returns overview statistics for the communication dashboard

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Today's metrics
    const todayMetric = await prisma.communicationMetric.findUnique({
      where: { date: today },
    })

    // Campaign counts by status
    const [draftCount, pendingCount, scheduledCount, sendingCount, sentCount] =
      await Promise.all([
        prisma.campaign.count({ where: { status: 'draft' } }),
        prisma.campaign.count({ where: { status: 'pending_approval' } }),
        prisma.campaign.count({ where: { status: 'scheduled' } }),
        prisma.campaign.count({ where: { status: 'sending' } }),
        prisma.campaign.count({ where: { status: 'sent' } }),
      ])

    // Contact stats
    const [totalContacts, activeContacts] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { isActive: true } }),
    ])

    // Segment counts
    const segments = await prisma.segment.findMany({
      select: { name: true, contactCount: true },
    })

    // Active sequences
    const activeSequences = await prisma.sequence.count({
      where: { status: 'active' },
    })
    const activeEnrollments = await prisma.sequenceEnrollment.count({
      where: { status: 'active' },
    })

    // Unread alerts
    const unreadAlerts = await prisma.alert.count({
      where: { isRead: false },
    })
    const criticalAlerts = await prisma.alert.count({
      where: { isRead: false, severity: 'critical' },
    })

    // Recent campaigns (last 5)
    const recentCampaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        priority: true,
        isUrgent: true,
        sentAt: true,
        scheduledAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      today: {
        messagesSent: todayMetric?.messagesSent || 0,
        messagesDelivered: todayMetric?.messagesDelivered || 0,
        messagesFailed: todayMetric?.messagesFailed || 0,
        messagesOpened: todayMetric?.messagesOpened || 0,
        deliveryRate: todayMetric?.deliveryRate || 0,
        openRate: todayMetric?.openRate || 0,
        campaignsSent: todayMetric?.campaignsSent || 0,
      },
      campaigns: {
        draft: draftCount,
        pending: pendingCount,
        scheduled: scheduledCount,
        sending: sendingCount,
        sent: sentCount,
        total: draftCount + pendingCount + scheduledCount + sendingCount + sentCount,
      },
      contacts: {
        total: totalContacts,
        active: activeContacts,
      },
      segments,
      sequences: {
        active: activeSequences,
        enrollments: activeEnrollments,
      },
      alerts: {
        unread: unreadAlerts,
        critical: criticalAlerts,
      },
      recentCampaigns,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
