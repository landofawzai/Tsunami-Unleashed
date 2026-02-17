// Tags API
// GET: List all tags
// POST: Create tag

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: any = {}
    if (category) where.category = category

    const tags = await prisma.contentTag.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ tags, total: tags.length })
  } catch (error) {
    console.error('Tags list error:', error)
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const existing = await prisma.contentTag.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: `Tag "${name}" already exists` }, { status: 409 })
    }

    const tag = await prisma.contentTag.create({
      data: {
        name,
        category: category || 'topic',
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Tag create error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
