// Translation Reviewed Webhook
// POST: External reviewer submits feedback on a translation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { translationId, contentId, action, reviewerNotes, editedBody } = body

    if (!action || !['approve', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'action is required: approve, reject, or edit' },
        { status: 400 }
      )
    }

    // Find translation by ID or contentId
    let translation
    if (translationId) {
      translation = await prisma.translation.findUnique({
        where: { id: translationId },
      })
    } else if (contentId) {
      translation = await prisma.translation.findUnique({
        where: { contentId },
      })
    }

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      reviewerNotes: reviewerNotes || null,
    }

    if (action === 'approve') {
      updateData.status = 'reviewed'
      updateData.reviewPass = Math.min(translation.reviewPass + 1, 3)
    } else if (action === 'reject') {
      updateData.status = 'ai_draft'
      updateData.reviewPass = 1
    } else if (action === 'edit') {
      if (!editedBody) {
        return NextResponse.json(
          { error: 'editedBody is required for edit action' },
          { status: 400 }
        )
      }
      updateData.body = editedBody
      updateData.status = 'reviewed'
      updateData.reviewPass = Math.min(translation.reviewPass + 1, 3)
    }

    const updated = await prisma.translation.update({
      where: { id: translation.id },
      data: updateData,
    })

    // Log Pabbly event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'inbound',
        workflowName: 'ROUTE-TranslationReview-to-Repurposing',
        eventType: 'translation_reviewed',
        payload: JSON.stringify({ translationId: translation.id, action }),
        status: 'received',
        relatedContentId: translation.contentId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Translation ${action}: ${updated.targetLanguage}`,
      translation: updated,
    })
  } catch (error) {
    console.error('Translation reviewed webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    )
  }
}
