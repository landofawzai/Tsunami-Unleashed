// Sources API
// GET: List source content with filters
// POST: Create new source content manually

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const contentType = searchParams.get('contentType')
    const mediaType = searchParams.get('mediaType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { contentId: { contains: search } },
      ]
    }

    if (contentType) where.contentType = contentType
    if (mediaType) where.mediaType = mediaType
    if (status) where.status = status

    const [sources, total] = await Promise.all([
      prisma.sourceContent.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              derivatives: true,
              processingJobs: true,
            },
          },
        },
      }),
      prisma.sourceContent.count({ where }),
    ])

    return NextResponse.json({
      sources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Sources list error:', error)
    return NextResponse.json(
      { error: 'Failed to load sources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, contentType, mediaType, language, sourceUrl, body: textBody, tags } = body

    if (!title || !contentType || !mediaType) {
      return NextResponse.json(
        { error: 'title, contentType, and mediaType are required' },
        { status: 400 }
      )
    }

    const contentId = `SRC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const source = await prisma.sourceContent.create({
      data: {
        contentId,
        title,
        contentType,
        mediaType,
        language: language || 'en',
        sourceUrl: sourceUrl || null,
        transcription: textBody || null,
        isTranscribed: mediaType === 'text' && !!textBody,
        tags: tags ? JSON.stringify(tags) : null,
        status: mediaType === 'text' && textBody ? 'ready' : 'pending',
        wordCount: textBody ? textBody.split(/\s+/).length : null,
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('Source create error:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}
