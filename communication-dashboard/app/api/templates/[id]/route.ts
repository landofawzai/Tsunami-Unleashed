// Template Detail API
// GET: Get template
// PUT: Update template
// DELETE: Deactivate template

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Increment usage count
    await prisma.template.update({
      where: { id: params.id },
      data: { usageCount: { increment: 1 } },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, type, body: templateBody, channelHints } = body

    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(templateBody && { body: templateBody }),
        ...(channelHints !== undefined && {
          channelHints: channelHints ? JSON.stringify(channelHints) : null,
        }),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.template.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Template deactivated' })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
