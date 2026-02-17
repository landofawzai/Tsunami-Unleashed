// Review Detail API
// GET: Get review detail

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.reviewRecord.findUnique({
      where: { id: params.id },
      include: {
        contentItem: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Review detail error:', error)
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 })
  }
}
