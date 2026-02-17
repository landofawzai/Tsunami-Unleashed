// Campaigns API
// GET: List campaigns with filters
// POST: Create a new campaign

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              versions: true,
              broadcasts: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ])

    return NextResponse.json({
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Campaign list error:', error)
    return NextResponse.json(
      { error: 'Failed to load campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, body: messageBody, priority, isUrgent, language, createdBy, scheduledAt } = body

    if (!title || !type || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, body' },
        { status: 400 }
      )
    }

    const validTypes = ['update', 'prayer', 'urgent', 'sequence_step', 'field_notice', 'announcement']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        type,
        body: messageBody,
        priority: priority || 'normal',
        isUrgent: isUrgent || false,
        language: language || 'en',
        createdBy: createdBy || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: isUrgent ? 'approved' : 'draft',
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Campaign create error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
