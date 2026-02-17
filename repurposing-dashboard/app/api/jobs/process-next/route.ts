// Process Next Job API
// POST: Trigger processing of the next queued job

import { NextResponse } from 'next/server'
import { processNextJob } from '@/lib/job-processor'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await processNextJob()

    if (!result) {
      return NextResponse.json({
        success: true,
        message: 'No queued jobs to process',
      })
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Job processed successfully' : (result.error || 'Job processing failed'),
      result,
    })
  } catch (error) {
    console.error('Process next job error:', error)
    return NextResponse.json(
      { error: 'Failed to process next job' },
      { status: 500 }
    )
  }
}
