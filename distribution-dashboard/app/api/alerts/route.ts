// GET /api/alerts
// Returns alerts with pagination and filtering

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const severity = searchParams.get('severity') || ''
    const category = searchParams.get('category') || ''
    const isRead = searchParams.get('isRead')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (severity) where.severity = severity
    if (category) where.category = category
    if (isRead !== null && isRead !== '') where.isRead = isRead === 'true'

    // Fetch alerts and total count in parallel
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ])

    // Calculate stats
    const stats = {
      total,
      unread: await prisma.alert.count({ where: { isRead: false } }),
      critical: await prisma.alert.count({ where: { severity: 'critical' } }),
      warning: await prisma.alert.count({ where: { severity: 'warning' } }),
      info: await prisma.alert.count({ where: { severity: 'info' } }),
    }

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        category: a.category,
        message: a.message,
        relatedPlatform: a.relatedPlatform,
        relatedContentId: a.relatedContentId,
        isRead: a.isRead,
        createdAt: a.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
