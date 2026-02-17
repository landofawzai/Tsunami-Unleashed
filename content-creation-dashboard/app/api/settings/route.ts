// Settings API
// GET: List all settings
// PATCH: Update settings

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, { value: string; description: string | null }> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = { value: s.value, description: s.description }
    })

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings object required' }, { status: 400 })
    }

    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true, updated: Object.keys(settings).length })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
