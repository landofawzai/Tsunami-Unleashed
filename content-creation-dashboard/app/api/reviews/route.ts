// Reviews API
// GET: List reviews (optionally filtered by status)
// POST: Submit a review for a content item

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCreationMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contentItemId = searchParams.get('contentItemId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status) where.status = status
    if (contentItemId) where.contentItemId = contentItemId

    const reviews = await prisma.reviewRecord.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        contentItem: {
          select: { id: true, contentId: true, title: true, status: true, contentType: true },
        },
      },
    })

    return NextResponse.json({ reviews, total: reviews.length })
  } catch (error) {
    console.error('Reviews list error:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId, reviewerName, status, feedback, theologicalAccuracy, clarity, productionQuality } = body

    if (!contentItemId || !reviewerName || !status) {
      return NextResponse.json(
        { error: 'contentItemId, reviewerName, and status are required' },
        { status: 400 }
      )
    }

    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } })
    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    const review = await prisma.reviewRecord.create({
      data: {
        contentItemId,
        reviewerName,
        status,
        feedback: feedback || null,
        theologicalAccuracy: theologicalAccuracy || null,
        clarity: clarity || null,
        productionQuality: productionQuality || null,
      },
      include: {
        contentItem: {
          select: { id: true, title: true },
        },
      },
    })

    // If approved, update content item status
    if (status === 'approved') {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { status: 'approved' },
      })
    } else if (status === 'revision_requested') {
      await prisma.contentItem.update({
        where: { id: contentItemId },
        data: { status: 'editing' },
      })
    }

    await updateCreationMetrics({ reviewsCompleted: 1 })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
