// Job Retry API
// POST: Retry a failed job

import { NextRequest, NextResponse } from 'next/server'
import { retryJob } from '@/lib/job-processor'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await retryJob(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Job retry error:', error)
    return NextResponse.json({ error: 'Failed to retry job' }, { status: 500 })
  }
}
