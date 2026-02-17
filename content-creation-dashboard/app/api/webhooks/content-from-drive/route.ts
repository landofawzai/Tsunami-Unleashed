// Webhook: Content from Google Drive
// POST: Receive notification of new file in Google Drive via Pabbly

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { generateContentId } from '@/lib/content-helpers'
import { updateCreationMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { title, contentType, mediaType, driveFileId, driveUrl, fileName, fileSize, mimeType } = body

    if (!title || !contentType || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, contentType, mediaType' },
        { status: 400 }
      )
    }

    const contentId = generateContentId()

    // Create content item
    const item = await prisma.contentItem.create({
      data: {
        contentId,
        title,
        contentType,
        mediaType,
        driveFileId: driveFileId || null,
        status: 'planning',
      },
    })

    // Create file reference if provided
    if (fileName && driveFileId) {
      await prisma.contentFile.create({
        data: {
          contentItemId: item.id,
          fileName,
          fileType: mediaType,
          mimeType: mimeType || null,
          fileSize: fileSize || null,
          driveFileId,
          driveUrl: driveUrl || null,
          isPrimary: true,
        },
      })
    }

    // Log Pabbly event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'inbound',
        workflowName: 'ROUTE-Drive-to-ContentCreation',
        eventType: 'file_detected',
        payload: JSON.stringify({ contentId, title, driveFileId, fileName }),
        status: 'received',
        relatedContentId: contentId,
      },
    })

    await updateCreationMetrics({ contentPlanned: 1 })

    return NextResponse.json({
      success: true,
      contentItem: item,
      message: `Content "${title}" created from Google Drive file.`,
    }, { status: 201 })
  } catch (error) {
    console.error('Content from Drive webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process Drive notification' },
      { status: 500 }
    )
  }
}
