// Series Detail API
// GET: Get series with content items
// PATCH: Update series

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { plannedDate: 'asc' },
          include: {
            _count: { select: { reviews: true, tasks: true, files: true } },
          },
        },
      },
    })

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    return NextResponse.json(series)
  } catch (error) {
    console.error('Series detail error:', error)
    return NextResponse.json({ error: 'Failed to load series' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, contentType, totalPlanned, status, tags } = body

    const series = await prisma.series.findUnique({ where: { id: params.id } })
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (contentType !== undefined) updateData.contentType = contentType
    if (totalPlanned !== undefined) updateData.totalPlanned = totalPlanned
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = typeof tags === 'string' ? tags : JSON.stringify(tags)

    const updated = await prisma.series.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Series update error:', error)
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 })
  }
}
