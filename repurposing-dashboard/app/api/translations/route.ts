// Translations API
// GET: List translations with filters

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const targetLanguage = searchParams.get('targetLanguage')
    const status = searchParams.get('status')
    const reviewPass = searchParams.get('reviewPass')
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

    if (targetLanguage) where.targetLanguage = targetLanguage
    if (status) where.status = status
    if (reviewPass) where.reviewPass = parseInt(reviewPass)

    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          derivative: {
            select: {
              id: true,
              title: true,
              derivativeType: true,
              body: true,
              sourceContent: {
                select: { id: true, title: true },
              },
            },
          },
        },
      }),
      prisma.translation.count({ where }),
    ])

    return NextResponse.json({
      translations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Translations list error:', error)
    return NextResponse.json(
      { error: 'Failed to load translations' },
      { status: 500 }
    )
  }
}
