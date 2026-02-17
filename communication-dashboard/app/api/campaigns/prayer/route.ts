// Prayer Campaign Quick-Create API
// POST: Streamlined prayer request broadcast creation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBroadcast, executeBroadcast } from '@/lib/broadcast-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: prayerBody, channels, sendImmediately } = body

    if (!title || !prayerBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Create campaign as prayer type, auto-approved
    const campaign = await prisma.campaign.create({
      data: {
        title,
        type: 'prayer',
        body: prayerBody,
        status: 'approved',
        priority: 'normal',
        language: 'en',
        approvedBy: 'prayer_dashboard',
        approvedAt: new Date(),
      },
    })

    // Find prayer_partners segment
    const prayerSegment = await prisma.segment.findUnique({
      where: { name: 'prayer_partners' },
    })

    if (!prayerSegment) {
      return NextResponse.json({
        campaign,
        warning: 'prayer_partners segment not found. Campaign created but no broadcast.',
      })
    }

    const selectedChannels = channels || ['email', 'whatsapp', 'telegram']

    // Create broadcast
    const broadcast = await createBroadcast(
      campaign.id,
      prayerSegment.id,
      selectedChannels
    )

    let sendResult = null
    if (sendImmediately !== false && broadcast) {
      // Prayer requests send immediately by default
      sendResult = await executeBroadcast(broadcast.broadcastId)

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'sent', sentAt: new Date() },
      })
    }

    return NextResponse.json({
      campaign,
      broadcast,
      sendResult,
      message: sendResult
        ? `Prayer request sent to ${sendResult.sent} recipients`
        : 'Prayer campaign created and queued',
    }, { status: 201 })
  } catch (error) {
    console.error('Prayer campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to create prayer broadcast' },
      { status: 500 }
    )
  }
}
