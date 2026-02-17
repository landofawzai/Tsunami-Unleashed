// Translation Review API
// POST: Submit a review for a translation

import { NextRequest, NextResponse } from 'next/server'
import { submitTranslationReview } from '@/lib/translation-engine'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, reviewerNotes, editedBody } = body

    if (!action || !['approve', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'action is required: approve, reject, or edit' },
        { status: 400 }
      )
    }

    if (action === 'edit' && !editedBody) {
      return NextResponse.json(
        { error: 'editedBody is required when action is "edit"' },
        { status: 400 }
      )
    }

    const result = await submitTranslationReview(params.id, action, reviewerNotes, editedBody)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Translation review submitted: ${action}`,
    })
  } catch (error) {
    console.error('Translation review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
