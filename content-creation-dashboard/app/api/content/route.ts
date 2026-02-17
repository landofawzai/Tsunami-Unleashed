// Content API
// GET: List content items with filters
// POST: Create new content item

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateContentId } from '@/lib/content-helpers'
import { updateCreationMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const contentType = searchParams.get('contentType')
    const mediaType = searchParams.get('mediaType')
    const status = searchParams.get('status')
    const seriesId = searchParams.get('seriesId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }
    if (contentType) where.contentType = contentType
    if (mediaType) where.mediaType = mediaType
    if (status) where.status = status
    if (seriesId) where.seriesId = seriesId

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          series: { select: { id: true, title: true } },
          _count: { select: { reviews: true, tasks: true, files: true } },
        },
      }),
      prisma.contentItem.count({ where }),
    ])

    return NextResponse.json({ items, total })
  } catch (error) {
    console.error('Content list error:', error)
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, contentType, mediaType, language, seriesId, priority, assignedTo, tags, targetLanguages, plannedDate } = body

    if (!title || !contentType || !mediaType) {
      return NextResponse.json(
        { error: 'title, contentType, and mediaType are required' },
        { status: 400 }
      )
    }

    const contentId = generateContentId()

    const item = await prisma.contentItem.create({
      data: {
        contentId,
        title,
        description: description || null,
        contentType,
        mediaType,
        language: language || 'en',
        seriesId: seriesId || null,
        priority: priority || 5,
        assignedTo: assignedTo || null,
        tags: tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
        targetLanguages: targetLanguages ? (typeof targetLanguages === 'string' ? targetLanguages : JSON.stringify(targetLanguages)) : null,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        status: 'planning',
      },
      include: {
        series: { select: { id: true, title: true } },
      },
    })

    await updateCreationMetrics({ contentPlanned: 1 })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Content create error:', error)
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
}
