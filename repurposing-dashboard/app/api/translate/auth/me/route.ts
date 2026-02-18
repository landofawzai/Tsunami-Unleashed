// GET /api/translate/auth/me — Get current authenticated user

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/translator-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        languages: JSON.parse(user.languages),
      },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
