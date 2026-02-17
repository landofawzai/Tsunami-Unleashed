// Campaign Schedule API
// POST: Schedule campaign with target segments and channels, then create broadcasts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBroadcast } from '@/lib/broadcast-engine'
import { updateCampaignStatus } from '@/lib/campaign-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { segmentIds, channels, scheduledAt } = body

    if (!segmentIds || !Array.isArray(segmentIds) || segmentIds.length === 0) {
      return NextResponse.json(
        { error: 'segmentIds array is required' },
        { status: 400 }
      )
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: 'channels array is required' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status !== 'approved') {
      return NextResponse.json(
        { error: 'Campaign must be approved before scheduling' },
        { status: 400 }
      )
    }

    // Update campaign scheduled time
    const scheduleDate = scheduledAt ? new Date(scheduledAt) : null
    await prisma.campaign.update({
      where: { id: params.id },
      data: { scheduledAt: scheduleDate },
    })

    // Update status to scheduled
    await updateCampaignStatus(params.id, 'scheduled')

    // Resolve segment names to IDs if needed
    const segments = await prisma.segment.findMany({
      where: {
        OR: [
          { id: { in: segmentIds } },
          { name: { in: segmentIds } },
        ],
      },
    })

    const resolvedSegmentIds = segments.map((s) => s.id)

    // Create broadcasts for each segment
    const broadcasts = []
    for (const segmentId of resolvedSegmentIds) {
      const result = await createBroadcast(
        params.id,
        segmentId,
        channels,
        scheduleDate || undefined
      )
      if (result) {
        broadcasts.push(result)
      }
    }

    const totalRecipients = broadcasts.reduce(
      (sum, b) => sum + b.totalRecipients,
      0
    )

    return NextResponse.json({
      status: 'scheduled',
      scheduledAt: scheduleDate,
      broadcasts: broadcasts.length,
      totalRecipients,
      message: `Campaign scheduled with ${broadcasts.length} broadcast(s) targeting ${totalRecipients} recipient(s)`,
    })
  } catch (error) {
    console.error('Campaign schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule campaign' },
      { status: 500 }
    )
  }
}
