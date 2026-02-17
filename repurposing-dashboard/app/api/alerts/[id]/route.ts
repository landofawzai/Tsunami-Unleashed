// Alert Detail API
// GET: Fetch single alert
// PATCH: Update alert (mark read/resolved)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Alert detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load alert' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isRead, isResolved } = body

    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (isRead !== undefined) updateData.isRead = isRead
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved
      if (isResolved) updateData.resolvedAt = new Date()
    }

    const updated = await prisma.alert.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Alert update error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
