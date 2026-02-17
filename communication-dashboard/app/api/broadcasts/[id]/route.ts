// Broadcast Detail API
// GET: Get broadcast with delivery breakdown

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: { id: true, title: true, type: true, isUrgent: true, body: true },
        },
        segment: {
          select: { id: true, name: true, color: true },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: { id: true, name: true, email: true, region: true, language: true },
            },
          },
        },
      },
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    // Channel breakdown
    const channelStats: Record<string, { sent: number; delivered: number; failed: number; opened: number }> = {}
    for (const delivery of broadcast.deliveries) {
      if (!channelStats[delivery.channel]) {
        channelStats[delivery.channel] = { sent: 0, delivered: 0, failed: 0, opened: 0 }
      }
      const stat = channelStats[delivery.channel]
      if (delivery.status === 'sent') stat.sent++
      else if (delivery.status === 'delivered') stat.delivered++
      else if (delivery.status === 'failed') stat.failed++
      else if (delivery.status === 'opened') stat.opened++
    }

    // Failure reasons
    const failureReasons: Record<string, number> = {}
    for (const delivery of broadcast.deliveries) {
      if (delivery.status === 'failed' && delivery.errorMessage) {
        failureReasons[delivery.errorMessage] = (failureReasons[delivery.errorMessage] || 0) + 1
      }
    }

    return NextResponse.json({
      ...broadcast,
      channelStats,
      failureReasons,
    })
  } catch (error) {
    console.error('Broadcast detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load broadcast' },
      { status: 500 }
    )
  }
}
