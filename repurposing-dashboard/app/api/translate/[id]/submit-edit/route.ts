// POST /api/translate/[id]/submit-edit — Submit a translation edit
// Open when portal is open, requires login when portal is closed
// Does NOT advance reviewPass — edits are pre-review improvements

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, isPortalOpen } from '@/lib/translator-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth: either portal is open OR user is logged in
    const user = await getUserFromRequest(request)
    const portalOpen = await isPortalOpen()

    if (!portalOpen && !user) {
      return NextResponse.json(
        { error: 'Portal is currently closed. Please log in to submit edits.' },
        { status: 403 }
      )
    }

    const { editedBody, editorNotes } = await request.json()

    if (!editedBody || editedBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'editedBody is required' },
        { status: 400 }
      )
    }

    const translation = await prisma.translation.findUnique({
      where: { id: params.id },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    if (translation.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot edit an approved translation' },
        { status: 400 }
      )
    }

    // Update translation body + audit trail
    await prisma.translation.update({
      where: { id: params.id },
      data: {
        body: editedBody.trim(),
        lastEditedBy: user?.username || 'anonymous',
        reviewerNotes: editorNotes
          ? `[Edit note] ${editorNotes}${translation.reviewerNotes ? '\n\n' + translation.reviewerNotes : ''}`
          : translation.reviewerNotes,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Translation updated',
      editedBy: user?.username || 'anonymous',
    })
  } catch (error: unknown) {
    console.error('Submit edit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit edit' },
      { status: 500 }
    )
  }
}
