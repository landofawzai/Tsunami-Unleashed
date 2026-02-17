// Calendar API
// GET: List calendar entries with date range
// POST: Create calendar entry

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const entryType = searchParams.get('entryType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }
    if (entryType) where.entryType = entryType

    const entries = await prisma.calendarEntry.findMany({
      where,
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        contentItem: {
          select: { id: true, contentId: true, title: true, status: true, contentType: true },
        },
      },
    })

    return NextResponse.json({ entries, total: entries.length })
  } catch (error) {
    console.error('Calendar list error:', error)
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId, title, description, entryType, date } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
    }

    const entry = await prisma.calendarEntry.create({
      data: {
        contentItemId: contentItemId || null,
        title,
        description: description || null,
        entryType: entryType || 'deadline',
        date: new Date(date),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Calendar create error:', error)
    return NextResponse.json({ error: 'Failed to create calendar entry' }, { status: 500 })
  }
}
