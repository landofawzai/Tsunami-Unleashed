// Campaign Detail API
// GET: Get campaign with versions and broadcasts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: [{ channel: 'asc' }, { language: 'asc' }],
        },
        broadcasts: {
          include: {
            segment: {
              select: { name: true, color: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Campaign detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load campaign' },
      { status: 500 }
    )
  }
}
