// Source Repurpose API
// POST: Trigger batch derivative generation for a source

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueJob } from '@/lib/job-processor'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const source = await prisma.sourceContent.findUnique({
      where: { id: params.id },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    if (source.status !== 'ready') {
      return NextResponse.json(
        { error: `Source status is "${source.status}" — must be "ready" to repurpose` },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const derivativeTypes = body.derivativeTypes || [
      'blog_post',
      'social_quote',
      'thread_summary',
      'study_guide',
      'newsletter_excerpt',
      'audio_transcription',
      'video_clip_meta',
      'quote_graphic',
    ]
    const languages = body.languages || ['hi', 'bn', 'mai']

    // Create derivative queue entry
    const queue = await prisma.derivativeQueue.create({
      data: {
        sourceContentId: source.id,
        derivativeTypes: JSON.stringify(derivativeTypes),
        languages: JSON.stringify(languages),
        totalExpected: derivativeTypes.length * (1 + languages.length),
        status: 'pending',
      },
    })

    // Enqueue batch repurpose job
    await enqueueJob(
      'batch_repurpose',
      source.id,
      { queueId: queue.id, derivativeTypes, languages },
      2
    )

    return NextResponse.json({
      success: true,
      message: `Batch repurpose queued: ${derivativeTypes.length} types × ${1 + languages.length} languages`,
      queueId: queue.id,
      expectedDerivatives: derivativeTypes.length,
      expectedTranslations: derivativeTypes.length * languages.length,
    })
  } catch (error) {
    console.error('Repurpose error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger repurpose' },
      { status: 500 }
    )
  }
}
