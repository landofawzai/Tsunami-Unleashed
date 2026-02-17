// Sequence Pause/Resume API
// POST: Toggle sequence between active and paused

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sequence = await prisma.sequence.findUnique({
      where: { id: params.id },
    })

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      )
    }

    const newStatus = sequence.status === 'active' ? 'paused' : 'active'

    await prisma.sequence.update({
      where: { id: params.id },
      data: { status: newStatus },
    })

    return NextResponse.json({
      status: newStatus,
      message: `Sequence ${newStatus === 'active' ? 'resumed' : 'paused'}`,
    })
  } catch (error) {
    console.error('Sequence pause error:', error)
    return NextResponse.json(
      { error: 'Failed to update sequence' },
      { status: 500 }
    )
  }
}
