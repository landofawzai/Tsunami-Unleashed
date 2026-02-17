// Sequence Steps API
// GET: List steps
// POST: Add a new step

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const steps = await prisma.sequenceStep.findMany({
      where: { sequenceId: params.id },
      orderBy: { stepNumber: 'asc' },
    })

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('Steps list error:', error)
    return NextResponse.json(
      { error: 'Failed to load steps' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { delayDays, subject, body: stepBody, channels } = body

    if (!stepBody) {
      return NextResponse.json(
        { error: 'Step body is required' },
        { status: 400 }
      )
    }

    // Get the next step number
    const lastStep = await prisma.sequenceStep.findFirst({
      where: { sequenceId: params.id },
      orderBy: { stepNumber: 'desc' },
    })
    const stepNumber = (lastStep?.stepNumber || 0) + 1

    const step = await prisma.sequenceStep.create({
      data: {
        sequenceId: params.id,
        stepNumber,
        delayDays: delayDays || 0,
        subject: subject || null,
        body: stepBody,
        channels: JSON.stringify(channels || ['email']),
      },
    })

    // Update total steps count
    await prisma.sequence.update({
      where: { id: params.id },
      data: { totalSteps: stepNumber },
    })

    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('Step create error:', error)
    return NextResponse.json(
      { error: 'Failed to create step' },
      { status: 500 }
    )
  }
}
