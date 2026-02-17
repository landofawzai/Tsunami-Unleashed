// Webhook: Repurposing Status Update
// POST: Receive status update from Pillar 2 (Repurposing Dashboard)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { contentId, status, derivativesGenerated, translationsCompleted, message } = body

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing required field: contentId' },
        { status: 400 }
      )
    }

    // Find the content item
    const item = await prisma.contentItem.findUnique({
      where: { contentId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Content item not found', contentId },
        { status: 404 }
      )
    }

    // Log Pabbly event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'inbound',
        workflowName: 'ROUTE-Repurposing-to-ContentCreation',
        eventType: 'status_update',
        payload: JSON.stringify({ contentId, status, derivativesGenerated, translationsCompleted, message }),
        status: 'received',
        relatedContentId: contentId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Status update received for "${item.title}".`,
    })
  } catch (error) {
    console.error('Repurposing status webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process status update' },
      { status: 500 }
    )
  }
}
