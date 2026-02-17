// Series API
// GET: List series
// POST: Create series

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const series = await prisma.series.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        items: {
          select: { id: true, status: true, contentType: true },
        },
      },
    })

    return NextResponse.json({ series, total: series.length })
  } catch (error) {
    console.error('Series list error:', error)
    return NextResponse.json({ error: 'Failed to load series' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, contentType, totalPlanned, tags } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const series = await prisma.series.create({
      data: {
        title,
        description: description || null,
        contentType: contentType || null,
        totalPlanned: totalPlanned || 0,
        tags: tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
      },
    })

    return NextResponse.json(series, { status: 201 })
  } catch (error) {
    console.error('Series create error:', error)
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 })
  }
}
