// PATCH /api/translate/users/[userId] — Toggle user active status
// Admin-only (checked via settings page, not middleware-protected)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { isActive } = await request.json()

    const user = await prisma.translatorUser.findUnique({
      where: { id: params.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    await prisma.translatorUser.update({
      where: { id: params.userId },
      data: { isActive },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
