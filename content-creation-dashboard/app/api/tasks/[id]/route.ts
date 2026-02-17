// Task Detail API
// PATCH: Update task status
// DELETE: Remove task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCreationMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, assignedTo, status, dueDate, sortOrder } = body

    const task = await prisma.productionTask.findUnique({ where: { id: params.id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (status !== undefined) {
      updateData.status = status
      if (status === 'completed' && task.status !== 'completed') {
        updateData.completedAt = new Date()
        await updateCreationMetrics({ tasksCompleted: 1 })
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const updated = await prisma.productionTask.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.productionTask.findUnique({ where: { id: params.id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.productionTask.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Task deleted' })
  } catch (error) {
    console.error('Task delete error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
