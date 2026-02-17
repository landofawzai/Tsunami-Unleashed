// Derivative Detail API
// GET: Fetch single derivative with translations
// PATCH: Update derivative body/status

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const derivative = await prisma.derivative.findUnique({
      where: { id: params.id },
      include: {
        sourceContent: {
          select: { id: true, title: true, contentId: true, contentType: true },
        },
        translations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!derivative) {
      return NextResponse.json(
        { error: 'Derivative not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(derivative)
  } catch (error) {
    console.error('Derivative detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load derivative' },
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
    const { title, body: newBody, status } = body

    const derivative = await prisma.derivative.findUnique({
      where: { id: params.id },
    })

    if (!derivative) {
      return NextResponse.json(
        { error: 'Derivative not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (newBody !== undefined) {
      updateData.body = newBody
      updateData.wordCount = newBody.split(/\s+/).length
    }
    if (status !== undefined) updateData.status = status

    const updated = await prisma.derivative.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Derivative update error:', error)
    return NextResponse.json(
      { error: 'Failed to update derivative' },
      { status: 500 }
    )
  }
}
