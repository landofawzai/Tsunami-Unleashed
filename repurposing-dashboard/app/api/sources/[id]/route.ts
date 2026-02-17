// Source Detail API
// GET: Fetch single source with derivatives and jobs

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await prisma.sourceContent.findUnique({
      where: { id: params.id },
      include: {
        derivatives: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { translations: true } },
          },
        },
        processingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(source)
  } catch (error) {
    console.error('Source detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load source' },
      { status: 500 }
    )
  }
}
