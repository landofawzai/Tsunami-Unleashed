// GET /api/dashboard/alerts
// Returns recent unread alerts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        category: a.category,
        message: a.message,
        relatedPlatform: a.relatedPlatform,
        createdAt: a.createdAt,
      })),
      total: alerts.length,
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
