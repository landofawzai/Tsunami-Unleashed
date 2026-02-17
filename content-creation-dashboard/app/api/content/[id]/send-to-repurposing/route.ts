// Send to Repurposing API
// POST: Finalize content and send to Pillar 2

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendToRepurposing } from '@/lib/pabbly-integration'
import { generateMetadata } from '@/lib/metadata-generator'
import { updateCreationMetrics, generateAlert } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.contentItem.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    if (item.sentToRepurposing) {
      return NextResponse.json(
        { error: 'Content has already been sent to repurposing' },
        { status: 409 }
      )
    }

    const validStatuses = ['approved', 'finalized']
    if (!validStatuses.includes(item.status)) {
      return NextResponse.json(
        { error: `Content must be approved or finalized before sending. Current status: ${item.status}` },
        { status: 400 }
      )
    }

    // Generate metadata sidecar
    const metadata = generateMetadata(item, true)

    // Fire Pabbly webhook
    const result = await sendToRepurposing({
      contentId: item.contentId,
      title: item.title,
      contentType: item.contentType,
      mediaType: item.mediaType,
      language: item.language,
      body: item.body,
      sourceUrl: item.sourceUrl,
      driveFileId: item.driveFileId,
      durationSeconds: item.durationSeconds,
      wordCount: item.wordCount,
      tags: item.tags,
      metadata: JSON.stringify(metadata),
    })

    if (!result.success) {
      await generateAlert('error', 'integration_error', `Failed to send "${item.title}" to repurposing: ${result.error}`, { contentId: item.contentId }, item.contentId)
      return NextResponse.json(
        { error: 'Failed to send to repurposing', details: result.error },
        { status: 500 }
      )
    }

    // Update item status
    const updated = await prisma.contentItem.update({
      where: { id: params.id },
      data: {
        status: 'sent_to_repurposing',
        sentToRepurposing: true,
        sentAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
    })

    await updateCreationMetrics({ contentSent: 1 })

    return NextResponse.json({
      success: true,
      contentItem: updated,
      message: `"${item.title}" sent to Repurposing Dashboard.`,
    })
  } catch (error) {
    console.error('Send to repurposing error:', error)
    return NextResponse.json(
      { error: 'Failed to send to repurposing' },
      { status: 500 }
    )
  }
}
