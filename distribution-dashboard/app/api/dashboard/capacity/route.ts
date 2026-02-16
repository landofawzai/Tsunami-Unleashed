// GET /api/dashboard/capacity
// Returns tier capacity information

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const capacities = await prisma.tierCapacity.findMany({
      orderBy: { tier: 'asc' },
    })

    return NextResponse.json({
      capacities: capacities.map((c) => ({
        tier: c.tier,
        totalSlots: c.totalSlots,
        usedSlots: c.usedSlots,
        reservedSlots: c.reservedSlots,
        availableSlots: c.availableSlots,
        usagePercentage:
          c.totalSlots > 0 ? (c.usedSlots / (c.totalSlots - c.reservedSlots)) * 100 : 0,
        isUnlimited: c.totalSlots === -1,
      })),
    })
  } catch (error) {
    console.error('Error fetching tier capacity:', error)
    return NextResponse.json({ error: 'Failed to fetch tier capacity' }, { status: 500 })
  }
}
