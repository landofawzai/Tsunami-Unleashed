// GET /api/content
// Returns paginated content items with filtering

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (tier) where.tier = parseInt(tier)

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        include: {
          distributionLogs: {
            select: {
              platform: true,
              status: true,
              postedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contentItem.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
