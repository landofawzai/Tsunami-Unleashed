// Briefs API
// GET: Get brief for content item
// POST: Create/update brief

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentItemId = searchParams.get('contentItemId')

    if (!contentItemId) {
      return NextResponse.json({ error: 'contentItemId is required' }, { status: 400 })
    }

    const briefs = await prisma.contentBrief.findMany({
      where: { contentItemId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ briefs, total: briefs.length })
  } catch (error) {
    console.error('Briefs list error:', error)
    return NextResponse.json({ error: 'Failed to load briefs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId, outline, keyPoints, targetAudience, estimatedDuration, estimatedWordCount, scriptureReferences, notes } = body

    if (!contentItemId) {
      return NextResponse.json({ error: 'contentItemId is required' }, { status: 400 })
    }

    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } })
    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    const brief = await prisma.contentBrief.create({
      data: {
        contentItemId,
        outline: outline || null,
        keyPoints: keyPoints ? (typeof keyPoints === 'string' ? keyPoints : JSON.stringify(keyPoints)) : null,
        targetAudience: targetAudience || null,
        estimatedDuration: estimatedDuration || null,
        estimatedWordCount: estimatedWordCount || null,
        scriptureReferences: scriptureReferences ? (typeof scriptureReferences === 'string' ? scriptureReferences : JSON.stringify(scriptureReferences)) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(brief, { status: 201 })
  } catch (error) {
    console.error('Brief create error:', error)
    return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
  }
}
