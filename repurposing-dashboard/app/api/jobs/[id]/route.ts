// Job Detail API
// GET: Get job details

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.processingJob.findUnique({
      where: { id: params.id },
      include: {
        sourceContent: {
          select: { id: true, title: true, contentId: true, contentType: true, mediaType: true },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Job detail error:', error)
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 })
  }
}
