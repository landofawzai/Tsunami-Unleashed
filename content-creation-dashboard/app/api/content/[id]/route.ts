// Content Detail API
// GET: Get content item with all relations
// PATCH: Update content item

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.contentItem.findUnique({
      where: { id: params.id },
      include: {
        series: true,
        reviews: { orderBy: { createdAt: 'desc' } },
        files: { orderBy: { isPrimary: 'desc' } },
        tasks: { orderBy: { sortOrder: 'asc' } },
        briefs: { orderBy: { createdAt: 'desc' } },
        calendarEntries: { orderBy: { date: 'asc' } },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Content detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title, description, contentType, mediaType, language,
      body: textBody, wordCount, durationSeconds, sourceUrl,
      driveFileId, thumbnailUrl, seriesId, status, priority,
      assignedTo, tags, targetLanguages, plannedDate,
    } = body

    const item = await prisma.contentItem.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (contentType !== undefined) updateData.contentType = contentType
    if (mediaType !== undefined) updateData.mediaType = mediaType
    if (language !== undefined) updateData.language = language
    if (textBody !== undefined) updateData.body = textBody
    if (wordCount !== undefined) updateData.wordCount = wordCount
    if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl
    if (driveFileId !== undefined) updateData.driveFileId = driveFileId
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (seriesId !== undefined) updateData.seriesId = seriesId || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (tags !== undefined) updateData.tags = typeof tags === 'string' ? tags : JSON.stringify(tags)
    if (targetLanguages !== undefined) updateData.targetLanguages = typeof targetLanguages === 'string' ? targetLanguages : JSON.stringify(targetLanguages)
    if (plannedDate !== undefined) updateData.plannedDate = plannedDate ? new Date(plannedDate) : null

    const updated = await prisma.contentItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        series: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
