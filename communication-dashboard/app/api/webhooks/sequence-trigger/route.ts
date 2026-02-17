// Sequence Trigger Webhook
// Called by Pabbly when a contact joins a segment (auto-enrollment)
// Also used as cron endpoint to process the sequence queue

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { processSequenceQueue, enrollContact } from '@/lib/sequence-engine'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action } = body

    // Action: process_queue — run the sequence queue processor
    if (action === 'process_queue') {
      const result = await processSequenceQueue()
      return NextResponse.json({
        success: true,
        ...result,
      })
    }

    // Action: enroll — auto-enroll a contact who joined a segment
    if (action === 'enroll') {
      const { contactId, segmentName } = body

      if (!contactId || !segmentName) {
        return NextResponse.json(
          { error: 'contactId and segmentName are required' },
          { status: 400 }
        )
      }

      // Find sequences that auto-enroll for this segment
      const segment = await prisma.segment.findUnique({
        where: { name: segmentName },
      })

      if (!segment) {
        return NextResponse.json(
          { error: 'Segment not found' },
          { status: 404 }
        )
      }

      const sequences = await prisma.sequence.findMany({
        where: {
          segmentId: segment.id,
          trigger: 'segment_join',
          status: 'active',
        },
      })

      const results = []
      for (const seq of sequences) {
        const result = await enrollContact(seq.id, contactId)
        results.push({ sequenceId: seq.id, sequenceName: seq.name, ...result })
      }

      return NextResponse.json({
        success: true,
        enrollments: results,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "process_queue" or "enroll"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Sequence trigger error:', error)
    return NextResponse.json(
      { error: 'Sequence trigger failed' },
      { status: 500 }
    )
  }
}
