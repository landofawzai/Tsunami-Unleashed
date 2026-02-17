// Broadcast Send API
// POST: Trigger immediate send of a pending broadcast

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { executeBroadcast } from '@/lib/broadcast-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: params.id },
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    if (broadcast.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot send broadcast in status: ${broadcast.status}` },
        { status: 400 }
      )
    }

    const result = await executeBroadcast(params.id)

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
    })
  } catch (error) {
    console.error('Broadcast send error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}
