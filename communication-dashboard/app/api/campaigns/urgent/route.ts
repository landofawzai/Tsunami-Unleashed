// Urgent Campaign API
// POST: Emergency broadcast - bypasses approval, sends immediately

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processUrgentBroadcast } from '@/lib/broadcast-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: urgentBody, segmentNames, channels } = body

    if (!title || !urgentBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Create campaign as urgent, auto-approved
    const campaign = await prisma.campaign.create({
      data: {
        title,
        type: 'urgent',
        body: urgentBody,
        status: 'approved',
        priority: 'urgent',
        isUrgent: true,
        language: 'en',
        approvedBy: 'urgent_dashboard',
        approvedAt: new Date(),
      },
    })

    // Resolve segments - default to all segments
    let segments
    if (segmentNames && segmentNames.length > 0) {
      segments = await prisma.segment.findMany({
        where: { name: { in: segmentNames } },
      })
    } else {
      segments = await prisma.segment.findMany()
    }

    const segmentIds = segments.map((s) => s.id)
    const selectedChannels = channels || ['email', 'sms', 'whatsapp', 'telegram', 'signal', 'social_media']

    // Send immediately
    const result = await processUrgentBroadcast(
      campaign.id,
      segmentIds,
      selectedChannels
    )

    return NextResponse.json({
      campaign,
      result,
      message: `URGENT ALERT sent to ${result.totalSent} recipients across ${segments.length} segment(s)`,
    }, { status: 201 })
  } catch (error) {
    console.error('Urgent campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to send urgent alert' },
      { status: 500 }
    )
  }
}
