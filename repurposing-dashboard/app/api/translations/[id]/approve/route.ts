// Translation Approve API
// POST: Approve a translation and optionally send to distribution

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateRepurposingMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const translation = await prisma.translation.findUnique({
      where: { id: params.id },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    if (translation.status === 'approved') {
      return NextResponse.json(
        { error: 'Translation is already approved' },
        { status: 400 }
      )
    }

    const updated = await prisma.translation.update({
      where: { id: params.id },
      data: {
        status: 'approved',
        reviewPass: 3,
      },
    })

    // Update metrics
    await updateRepurposingMetrics({ translationsCompleted: 1 })

    return NextResponse.json({
      success: true,
      message: `Translation approved: ${updated.targetLanguage}`,
      translation: updated,
    })
  } catch (error) {
    console.error('Translation approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve translation' },
      { status: 500 }
    )
  }
}
