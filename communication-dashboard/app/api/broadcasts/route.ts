// Broadcasts API
// GET: List broadcasts with filters

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: { title: true, type: true, isUrgent: true },
          },
          segment: {
            select: { name: true, color: true },
          },
          _count: {
            select: { deliveries: true },
          },
        },
      }),
      prisma.broadcast.count({ where }),
    ])

    return NextResponse.json({
      broadcasts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Broadcast list error:', error)
    return NextResponse.json(
      { error: 'Failed to load broadcasts' },
      { status: 500 }
    )
  }
}
