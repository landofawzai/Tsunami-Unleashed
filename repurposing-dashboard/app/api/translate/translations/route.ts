// GET /api/translate/translations — List translations for the portal
// Filtered by language, optionally by status. Simplified for mobile.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!lang) {
      return NextResponse.json(
        { error: 'lang query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      targetLanguage: lang,
    }

    if (status) {
      if (status === 'needs_work') {
        where.status = { in: ['ai_draft', 'failed'] }
      } else if (status === 'in_review') {
        where.status = { in: ['review_pending', 'reviewed'] }
      } else {
        where.status = status
      }
    }

    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        select: {
          id: true,
          contentId: true,
          title: true,
          body: true,
          status: true,
          reviewPass: true,
          targetLanguage: true,
          sourceLanguage: true,
          lastEditedBy: true,
          updatedAt: true,
          derivative: {
            select: {
              id: true,
              title: true,
              derivativeType: true,
            },
          },
        },
      }),
      prisma.translation.count({ where }),
    ])

    return NextResponse.json({
      translations: translations.map((t) => ({
        ...t,
        bodyPreview: t.body.substring(0, 200),
        body: undefined, // Don't send full body in list
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    console.error('Portal translations list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    )
  }
}
