// Templates API
// GET: List templates
// POST: Create a new template

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Template list error:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, body: templateBody, channelHints, language } = body

    if (!name || !type || !templateBody) {
      return NextResponse.json(
        { error: 'Name, type, and body are required' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        name,
        type,
        body: templateBody,
        channelHints: channelHints ? JSON.stringify(channelHints) : null,
        language: language || 'en',
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
