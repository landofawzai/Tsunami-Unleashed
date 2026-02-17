// Sequence Detail API
// GET: Get sequence with steps and enrollments

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sequence = await prisma.sequence.findUnique({
      where: { id: params.id },
      include: {
        segment: {
          select: { id: true, name: true, color: true, contactCount: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        enrollments: {
          include: {
            contact: {
              select: { id: true, name: true, email: true, region: true },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    })

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sequence)
  } catch (error) {
    console.error('Sequence detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load sequence' },
      { status: 500 }
    )
  }
}
