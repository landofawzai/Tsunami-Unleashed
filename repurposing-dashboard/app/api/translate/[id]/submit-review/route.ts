// POST /api/translate/[id]/submit-review — Submit a review action
// Protected by middleware.ts — requires valid JWT
// Only reviewer and admin roles can access

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/translator-auth'
import { submitTranslationReview } from '@/lib/translation-engine'
import { updateRepurposingMetrics } from '@/lib/metrics-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user (middleware already verified JWT exists)
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only reviewer and admin can review
    if (user.role !== 'reviewer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Reviewer or admin role required' },
        { status: 403 }
      )
    }

    const { action, reviewerNotes, editedBody } = await request.json()

    if (!action || !['approve', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be approve, reject, or edit' },
        { status: 400 }
      )
    }

    if (action === 'edit' && (!editedBody || editedBody.trim().length === 0)) {
      return NextResponse.json(
        { error: 'editedBody is required for edit action' },
        { status: 400 }
      )
    }

    // Check if this is a final approve request
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
        { error: 'Translation is already approved' },
        { status: 400 }
      )
    }

    // Use existing translation engine for review logic
    const result = await submitTranslationReview(
      params.id,
      action,
      reviewerNotes ? `[${user.displayName}] ${reviewerNotes}` : undefined,
      action === 'edit' ? editedBody.trim() : undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Update audit trail
    await prisma.translation.update({
      where: { id: params.id },
      data: { lastEditedBy: user.username },
    })

    // Check if this approval resulted in final approval (pass 3)
    const updated = await prisma.translation.findUnique({
      where: { id: params.id },
    })
    if (updated?.status === 'approved') {
      await updateRepurposingMetrics({ translationsCompleted: 1 })
    }

    return NextResponse.json({
      success: true,
      message: `Review action '${action}' completed`,
      reviewer: user.displayName,
    })
  } catch (error: unknown) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
