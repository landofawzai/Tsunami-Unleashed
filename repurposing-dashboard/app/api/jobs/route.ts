// Jobs API
// GET: List processing jobs with filters
// POST: Create a manual job

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueJob } from '@/lib/job-processor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const jobType = searchParams.get('jobType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (jobType) where.jobType = jobType

    const [jobs, total] = await Promise.all([
      prisma.processingJob.findMany({
        where,
        orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: { sourceContent: { select: { id: true, title: true, contentId: true } } },
      }),
      prisma.processingJob.count({ where }),
    ])

    return NextResponse.json({ jobs, total, limit, offset })
  } catch (error) {
    console.error('Jobs list error:', error)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobType, sourceContentId, inputData, priority } = body

    if (!jobType) {
      return NextResponse.json({ error: 'jobType is required' }, { status: 400 })
    }

    const validTypes = ['transcription', 'clip_extraction', 'derivative_generation', 'translation', 'image_generation', 'batch_repurpose']
    if (!validTypes.includes(jobType)) {
      return NextResponse.json({ error: `Invalid jobType. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const job = await enqueueJob(
      jobType,
      sourceContentId || null,
      inputData || {},
      priority || 5
    )

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    console.error('Job create error:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
