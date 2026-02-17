// Segment Detail API
// GET: Get segment with contacts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Support lookup by ID or name
    const segment = await prisma.segment.findFirst({
      where: {
        OR: [
          { id: params.id },
          { name: params.id },
        ],
      },
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                region: true,
                country: true,
                language: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { broadcasts: true },
        },
      },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(segment)
  } catch (error) {
    console.error('Segment detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load segment' },
      { status: 500 }
    )
  }
}
