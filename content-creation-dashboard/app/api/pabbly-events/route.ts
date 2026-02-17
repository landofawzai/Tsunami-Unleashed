// Pabbly Events API
// GET: List webhook event log

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (direction) where.direction = direction
    if (status) where.status = status

    const events = await prisma.pabblyEvent.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ events, total: events.length })
  } catch (error) {
    console.error('Pabbly events error:', error)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}
