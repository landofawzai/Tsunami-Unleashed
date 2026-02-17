// Dashboard Alerts API
// Returns recent unread alerts for the dashboard overview

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isRead: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        severity: true,
        category: true,
        message: true,
        createdAt: true,
      },
    })

    const total = await prisma.alert.count({ where: { isRead: false } })

    return NextResponse.json({
      alerts,
      total,
    })
  } catch (error) {
    console.error('Dashboard alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to load alerts' },
      { status: 500 }
    )
  }
}
