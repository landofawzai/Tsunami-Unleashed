// Derivatives API
// GET: List derivatives with filters

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const derivativeType = searchParams.get('derivativeType')
    const status = searchParams.get('status')
    const language = searchParams.get('language')
    const sourceContentId = searchParams.get('sourceContentId')
    const sentToDistribution = searchParams.get('sentToDistribution')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { contentId: { contains: search } },
        { body: { contains: search } },
      ]
    }

    if (derivativeType) where.derivativeType = derivativeType
    if (status) where.status = status
    if (language) where.language = language
    if (sourceContentId) where.sourceContentId = sourceContentId
    if (sentToDistribution === 'true') where.sentToDistribution = true
    if (sentToDistribution === 'false') where.sentToDistribution = false

    const [derivatives, total] = await Promise.all([
      prisma.derivative.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceContent: {
            select: { id: true, title: true, contentId: true },
          },
          _count: { select: { translations: true } },
        },
      }),
      prisma.derivative.count({ where }),
    ])

    return NextResponse.json({
      derivatives,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Derivatives list error:', error)
    return NextResponse.json(
      { error: 'Failed to load derivatives' },
      { status: 500 }
    )
  }
}
