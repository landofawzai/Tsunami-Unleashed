// Files API
// GET: List files for content item
// POST: Add file reference

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

    const files = await prisma.contentFile.findMany({
      where: { contentItemId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ files, total: files.length })
  } catch (error) {
    console.error('Files list error:', error)
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId, fileName, fileType, mimeType, fileSize, driveFileId, driveUrl, isPrimary } = body

    if (!contentItemId || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'contentItemId, fileName, and fileType are required' },
        { status: 400 }
      )
    }

    const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } })
    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    const file = await prisma.contentFile.create({
      data: {
        contentItemId,
        fileName,
        fileType,
        mimeType: mimeType || null,
        fileSize: fileSize || null,
        driveFileId: driveFileId || null,
        driveUrl: driveUrl || null,
        isPrimary: isPrimary || false,
      },
    })

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error('File create error:', error)
    return NextResponse.json({ error: 'Failed to add file' }, { status: 500 })
  }
}
