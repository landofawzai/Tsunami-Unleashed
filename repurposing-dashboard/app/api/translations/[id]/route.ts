// Translation Detail API
// GET: Fetch single translation with derivative
// PATCH: Update translation body/status

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const translation = await prisma.translation.findUnique({
      where: { id: params.id },
      include: {
        derivative: {
          select: {
            id: true,
            title: true,
            body: true,
            derivativeType: true,
            language: true,
            sourceContent: {
              select: { id: true, title: true, contentId: true },
            },
          },
        },
      },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(translation)
  } catch (error) {
    console.error('Translation detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load translation' },
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
    const { title, body: newBody, status, reviewerNotes, reviewPass } = body

    const translation = await prisma.translation.findUnique({
      where: { id: params.id },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (newBody !== undefined) updateData.body = newBody
    if (status !== undefined) updateData.status = status
    if (reviewerNotes !== undefined) updateData.reviewerNotes = reviewerNotes
    if (reviewPass !== undefined) updateData.reviewPass = reviewPass

    const updated = await prisma.translation.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Translation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    )
  }
}
