// Settings API
// GET: List all system settings
// PATCH: Update settings

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value map for easy frontend use
    const settingsMap: Record<string, { value: string; description: string | null }> = {}
    for (const s of settings) {
      settingsMap[s.key] = { value: s.value, description: s.description }
    }

    return NextResponse.json({
      settings,
      settingsMap,
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body // Array of { key, value }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      )
    }

    const results = []
    for (const { key, value } of updates) {
      const result = await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
      results.push(result)
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
