// Webhook: Delivery Status Callback
// Called by Pabbly Connect when a message delivery status changes

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCommunicationMetrics, generateAlert } from '@/lib/campaign-helpers'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { broadcastId, contactId, channel, status, externalId, errorMessage } = body

    // Validate required fields
    if (!broadcastId || !contactId || !channel || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: broadcastId, contactId, channel, status' },
        { status: 400 }
      )
    }

    const validStatuses = ['sent', 'delivered', 'opened', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find the delivery log entry
    const deliveryLog = await prisma.deliveryLog.findFirst({
      where: { broadcastId, contactId, channel },
    })

    if (!deliveryLog) {
      return NextResponse.json(
        { error: 'Delivery log not found for this broadcast/contact/channel combination' },
        { status: 404 }
      )
    }

    // Update delivery log
    const updateData: Record<string, unknown> = { status }
    if (status === 'sent') updateData.sentAt = new Date()
    if (status === 'delivered') updateData.deliveredAt = new Date()
    if (status === 'opened') updateData.openedAt = new Date()
    if (status === 'failed') updateData.errorMessage = errorMessage || 'Unknown error'
    if (externalId) updateData.externalId = externalId

    await prisma.deliveryLog.update({
      where: { id: deliveryLog.id },
      data: updateData,
    })

    // Update broadcast aggregate counts
    if (status === 'delivered') {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { delivered: { increment: 1 } },
      })
      await updateCommunicationMetrics({ messagesDelivered: 1 })
    } else if (status === 'opened') {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { opened: { increment: 1 } },
      })
      await updateCommunicationMetrics({ messagesOpened: 1 })
    } else if (status === 'failed') {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { failed: { increment: 1 } },
      })
      await updateCommunicationMetrics({ messagesFailed: 1 })

      // Generate alert for failures
      await generateAlert(
        'warning',
        'delivery_failure',
        `Delivery failed on ${channel} for contact ${contactId}: ${errorMessage || 'Unknown error'}`,
        { broadcastId, contactId, channel, errorMessage }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deliveryLogId: deliveryLog.id, status },
    })
  } catch (error) {
    console.error('Delivery status webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
