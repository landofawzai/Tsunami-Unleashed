// POST /api/translate/auth/register — Create new translator user (admin only)
// Protected by middleware.ts — requires valid JWT

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, getPayloadFromRequest } from '@/lib/translator-auth'

export async function POST(request: NextRequest) {
  try {
    // Verify caller is admin
    const payload = await getPayloadFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { username, password, displayName, role, languages } = await request.json()

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: 'username, password, and displayName are required' },
        { status: 400 }
      )
    }

    const validRoles = ['translator', 'reviewer', 'admin']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for duplicate username
    const existing = await prisma.translatorUser.findUnique({
      where: { username: username.toLowerCase().trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.translatorUser.create({
      data: {
        username: username.toLowerCase().trim(),
        passwordHash,
        displayName,
        role: role || 'translator',
        languages: JSON.stringify(languages || []),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        languages: JSON.parse(user.languages),
      },
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
