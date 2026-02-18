// GET/POST /api/translate/users — User management (admin only)
// Protected by middleware.ts — requires valid JWT

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPayloadFromRequest, hashPassword } from '@/lib/translator-auth'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const users = await prisma.translatorUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        languages: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        languages: JSON.parse(u.languages),
      })),
    })
  } catch (error: unknown) {
    console.error('List users error:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
