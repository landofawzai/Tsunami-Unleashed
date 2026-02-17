// Sequences API
// GET: List sequences
// POST: Create a new sequence

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sequences = await prisma.sequence.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        segment: {
          select: { name: true, color: true },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    })

    // Get enrollment stats per sequence
    const enriched = await Promise.all(
      sequences.map(async (seq) => {
        const [active, completed, exited] = await Promise.all([
          prisma.sequenceEnrollment.count({
            where: { sequenceId: seq.id, status: 'active' },
          }),
          prisma.sequenceEnrollment.count({
            where: { sequenceId: seq.id, status: 'completed' },
          }),
          prisma.sequenceEnrollment.count({
            where: { sequenceId: seq.id, status: 'exited' },
          }),
        ])
        return {
          ...seq,
          enrollmentStats: { active, completed, exited },
        }
      })
    )

    return NextResponse.json({ sequences: enriched })
  } catch (error) {
    console.error('Sequence list error:', error)
    return NextResponse.json(
      { error: 'Failed to load sequences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, segmentId, trigger } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const sequence = await prisma.sequence.create({
      data: {
        name,
        description: description || null,
        segmentId: segmentId || null,
        trigger: trigger || 'manual',
        status: 'active',
      },
    })

    return NextResponse.json(sequence, { status: 201 })
  } catch (error) {
    console.error('Sequence create error:', error)
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    )
  }
}
