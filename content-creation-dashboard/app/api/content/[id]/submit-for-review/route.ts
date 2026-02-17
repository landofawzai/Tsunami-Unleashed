// Submit for Review API
// POST: Move content item to review status

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (item.status === 'review') {
      return NextResponse.json(
        { error: 'Content is already in review' },
        { status: 409 }
      )
    }

    const updated = await prisma.contentItem.update({
      where: { id: params.id },
      data: { status: 'review' },
    })

    return NextResponse.json({
      success: true,
      contentItem: updated,
      message: `"${item.title}" submitted for review.`,
    })
  } catch (error) {
    console.error('Submit for review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit for review' },
      { status: 500 }
    )
  }
}
