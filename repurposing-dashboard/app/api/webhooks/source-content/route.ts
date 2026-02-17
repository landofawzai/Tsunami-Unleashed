// Webhook: Source Content Ingestion
// POST: Receive new source content from Pabbly (Content Creation pillar)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { enqueueJob } from '@/lib/job-processor'
import { updateRepurposingMetrics, generateAlert } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { contentId, title, contentType, mediaType, language, sourceUrl, driveFileId, durationSeconds, wordCount, body: textBody, tags, metadata } = body

    if (!contentId || !title || !contentType || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, title, contentType, mediaType' },
        { status: 400 }
      )
    }

    // Check if already ingested
    const existing = await prisma.sourceContent.findUnique({ where: { contentId } })
    if (existing) {
      return NextResponse.json(
        { error: 'Content already ingested', contentId },
        { status: 409 }
      )
    }

    // Create source content record
    const source = await prisma.sourceContent.create({
      data: {
        contentId,
        title,
        contentType,
        mediaType,
        language: language || 'en',
        sourceUrl,
        driveFileId,
        durationSeconds,
        wordCount,
        transcription: textBody || null,
        isTranscribed: mediaType === 'text' && !!textBody,
        tags: tags ? JSON.stringify(tags) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: mediaType === 'text' ? 'ready' : 'pending',
      },
    })

    // Log Pabbly event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'inbound',
        workflowName: 'ROUTE-SourceContent-to-Repurposing',
        eventType: 'source_ingested',
        payload: JSON.stringify({ contentId, title, mediaType }),
        status: 'received',
        relatedContentId: contentId,
      },
    })

    // Enqueue processing job
    if (mediaType !== 'text') {
      // Audio/video needs transcription first
      await enqueueJob('transcription', source.id, { mediaType, duration: durationSeconds }, 1)
    }

    // Enqueue batch repurpose (will run after transcription)
    await enqueueJob('batch_repurpose', source.id, {
      derivativeTypes: ['blog_post', 'social_quote', 'thread_summary', 'study_guide', 'newsletter_excerpt', 'quote_graphic'],
    }, 3)

    // Update metrics
    await updateRepurposingMetrics({ sourcesIngested: 1 })

    return NextResponse.json({
      success: true,
      sourceContent: source,
      message: `Source content "${title}" ingested. Processing jobs queued.`,
    }, { status: 201 })
  } catch (error) {
    console.error('Source content webhook error:', error)
    await generateAlert('error', 'system_error', 'Source content ingestion failed', { error: String(error) })
    return NextResponse.json(
      { error: 'Failed to ingest source content' },
      { status: 500 }
    )
  }
}
