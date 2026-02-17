// Webhook: Job Complete Callback
// POST: Receive external processing completion notifications

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { jobId, status, outputData, errorMessage } = body

    if (!jobId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, status' },
        { status: 400 }
      )
    }

    const job = await prisma.processingJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: status === 'completed' ? 'completed' : 'failed',
        progress: status === 'completed' ? 100 : job.progress,
        outputData: outputData ? JSON.stringify(outputData) : null,
        errorMessage: errorMessage || null,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} marked as ${status}`,
    })
  } catch (error) {
    console.error('Job complete webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process job completion' },
      { status: 500 }
    )
  }
}
