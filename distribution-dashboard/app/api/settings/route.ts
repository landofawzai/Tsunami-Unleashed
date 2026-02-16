// GET /api/settings
// Returns system settings and configuration

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch tier capacities
    const tierCapacities = await prisma.tierCapacity.findMany({
      orderBy: { tier: 'asc' },
    })

    // System info
    const systemInfo = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
      apiKeyConfigured: !!process.env.API_KEY,
    }

    // Webhook URLs (for Pabbly integration)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const webhookUrls = {
      contentPosted: `${baseUrl}/api/webhooks/content-posted`,
      contentFailed: `${baseUrl}/api/webhooks/content-failed`,
    }

    return NextResponse.json({
      tierCapacities: tierCapacities.map((c) => ({
        tier: c.tier,
        totalSlots: c.totalSlots,
        usedSlots: c.usedSlots,
        reservedSlots: c.reservedSlots,
        availableSlots: c.availableSlots,
      })),
      systemInfo,
      webhookUrls,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
