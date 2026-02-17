// Segments API
// GET: List all segments
// POST: Create a new segment

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            contacts: true,
            broadcasts: true,
          },
        },
      },
    })

    return NextResponse.json({ segments })
  } catch (error) {
    console.error('Segment list error:', error)
    return NextResponse.json(
      { error: 'Failed to load segments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const segment = await prisma.segment.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '_'),
        description: description || null,
        color: color || null,
      },
    })

    return NextResponse.json(segment, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A segment with this name already exists' },
        { status: 409 }
      )
    }
    console.error('Segment create error:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}
