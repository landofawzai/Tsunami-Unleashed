// Language Detail API
// PATCH: Update language configuration

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, nativeName, isActive, priority, hasLocalReviewer, reviewerContact } = body

    const language = await prisma.languageConfig.findUnique({
      where: { id: params.id },
    })

    if (!language) {
      return NextResponse.json(
        { error: 'Language not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (nativeName !== undefined) updateData.nativeName = nativeName
    if (isActive !== undefined) updateData.isActive = isActive
    if (priority !== undefined) updateData.priority = priority
    if (hasLocalReviewer !== undefined) updateData.hasLocalReviewer = hasLocalReviewer
    if (reviewerContact !== undefined) updateData.reviewerContact = reviewerContact

    const updated = await prisma.languageConfig.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Language update error:', error)
    return NextResponse.json(
      { error: 'Failed to update language' },
      { status: 500 }
    )
  }
}
