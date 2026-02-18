// POST /api/translate/auth/login — Authenticate translator/reviewer

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signJWT, setAuthCookie } from '@/lib/translator-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.translatorUser.findUnique({
      where: { username: username.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.translatorUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Sign JWT and set cookie
    const token = await signJWT({
      sub: user.id,
      username: user.username,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        languages: JSON.parse(user.languages),
      },
    })

    setAuthCookie(response, token)
    return response
  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
