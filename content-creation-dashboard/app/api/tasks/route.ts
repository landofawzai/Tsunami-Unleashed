// Tasks API
// GET: List tasks for content item
// POST: Create task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCreationMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentItemId = searchParams.get('contentItemId')
    const status = searchParams.get('status')

    const where: any = {}
    if (contentItemId) where.contentItemId = contentItemId
    if (status) where.status = status

    const tasks = await prisma.productionTask.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        contentItem: {
          select: { id: true, title: true, contentId: true },
        },
      },
    })

    return NextResponse.json({ tasks, total: tasks.length })
  } catch (error) {
    console.error('Tasks list error:', error)
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId, title, description, assignedTo, dueDate, sortOrder } = body

    if (!contentItemId || !title) {
      return NextResponse.json(
        { error: 'contentItemId and title are required' },
        { status: 400 }
      )
    }

    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } })
    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    const task = await prisma.productionTask.create({
      data: {
        contentItemId,
        title,
        description: description || null,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Task create error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
