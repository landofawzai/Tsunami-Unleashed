// Languages API
// GET: List language configurations
// POST: Add new language

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const languages = await prisma.languageConfig.findMany({
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      languages,
      total: languages.length,
    })
  } catch (error) {
    console.error('Languages list error:', error)
    return NextResponse.json(
      { error: 'Failed to load languages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, nativeName, priority } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'code and name are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.languageConfig.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Language ${code} already exists` },
        { status: 409 }
      )
    }

    const language = await prisma.languageConfig.create({
      data: {
        code,
        name,
        nativeName: nativeName || null,
        priority: priority || 5,
      },
    })

    return NextResponse.json(language, { status: 201 })
  } catch (error) {
    console.error('Language create error:', error)
    return NextResponse.json(
      { error: 'Failed to create language' },
      { status: 500 }
    )
  }
}
