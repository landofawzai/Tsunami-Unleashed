// Job Processor — Async Job Queue Engine
// Processes transcription, derivative generation, translation, and image generation jobs

import { prisma } from './prisma'

type JobType = 'transcription' | 'clip_extraction' | 'derivative_generation' | 'translation' | 'image_generation' | 'batch_repurpose'

interface JobResult {
  success: boolean
  outputData?: Record<string, unknown>
  error?: string
}

/**
 * Enqueue a new processing job
 */
export async function enqueueJob(
  jobType: JobType,
  sourceContentId: string | null,
  inputData: Record<string, unknown>,
  priority: number = 5
) {
  return prisma.processingJob.create({
    data: {
      sourceContentId,
      jobType,
      status: 'queued',
      priority,
      progress: 0,
      inputData: JSON.stringify(inputData),
    },
  })
}

/**
 * Pick and process the next queued job (highest priority, oldest first)
 */
export async function processNextJob(): Promise<JobResult> {
  const job = await prisma.processingJob.findFirst({
    where: { status: 'queued' },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })

  if (!job) {
    return { success: true, outputData: { message: 'No jobs in queue' } }
  }

  return processJob(job.id)
}

/**
 * Process a specific job by ID
 */
export async function processJob(jobId: string): Promise<JobResult> {
  const job = await prisma.processingJob.findUnique({ where: { id: jobId } })
  if (!job) {
    return { success: false, error: 'Job not found' }
  }

  // Mark as processing
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: 'processing', startedAt: new Date(), progress: 5 },
  })

  try {
    let result: JobResult

    switch (job.jobType) {
      case 'transcription':
        result = await processTranscriptionJob(job)
        break
      case 'derivative_generation':
        result = await processDerivativeJob(job)
        break
      case 'translation':
        result = await processTranslationJob(job)
        break
      case 'image_generation':
        result = await processImageJob(job)
        break
      case 'batch_repurpose':
        result = await processBatchJob(job)
        break
      default:
        result = { success: false, error: `Unknown job type: ${job.jobType}` }
    }

    // Update job status
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: result.success ? 'completed' : 'failed',
        progress: result.success ? 100 : job.progress,
        outputData: result.outputData ? JSON.stringify(result.outputData) : null,
        errorMessage: result.error,
        completedAt: result.success ? new Date() : null,
      },
    })

    // Update daily metrics
    await updateJobMetrics(result.success)

    return result
  } catch (error) {
    const errorMsg = `Job processing failed: ${error}`
    const retryCount = job.retryCount + 1

    if (retryCount < job.maxRetries) {
      // Re-queue for retry
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'queued',
          retryCount,
          errorMessage: errorMsg,
          progress: 0,
        },
      })
    } else {
      // Max retries exceeded
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          retryCount,
          errorMessage: `${errorMsg} (max retries exceeded)`,
          completedAt: new Date(),
        },
      })

      // Create alert for failed job
      await prisma.alert.create({
        data: {
          severity: 'error',
          category: 'processing_failure',
          message: `Job ${job.jobType} failed after ${retryCount} retries`,
          details: JSON.stringify({ jobId, jobType: job.jobType, error: errorMsg }),
          relatedContentId: job.sourceContentId,
        },
      })
    }

    return { success: false, error: errorMsg }
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<JobResult> {
  const job = await prisma.processingJob.findUnique({ where: { id: jobId } })
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status !== 'failed') return { success: false, error: 'Job is not in failed state' }

  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: 'queued', progress: 0, errorMessage: null },
  })

  return { success: true, outputData: { message: 'Job re-queued for retry' } }
}

/**
 * Cancel a queued job
 */
export async function cancelJob(jobId: string): Promise<JobResult> {
  const job = await prisma.processingJob.findUnique({ where: { id: jobId } })
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status !== 'queued') return { success: false, error: 'Can only cancel queued jobs' }

  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: 'cancelled', completedAt: new Date() },
  })

  return { success: true, outputData: { message: 'Job cancelled' } }
}

// ── Job type processors (stubs for Session 2, implemented in Session 3) ──

async function processTranscriptionJob(job: { id: string; sourceContentId: string | null; inputData: string | null }): Promise<JobResult> {
  // Update progress
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 20 } })

  if (!job.sourceContentId) {
    return { success: false, error: 'No source content ID for transcription job' }
  }

  const source = await prisma.sourceContent.findUnique({ where: { id: job.sourceContentId } })
  if (!source) return { success: false, error: 'Source content not found' }

  if (source.mediaType === 'text') {
    return { success: true, outputData: { message: 'Text content does not need transcription' } }
  }

  // Placeholder: actual ElevenLabs Scribe call happens when API key is configured
  // The transcription-engine.ts handles the actual API call
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 50 } })

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return {
      success: true,
      outputData: {
        message: 'Transcription skipped — ELEVENLABS_API_KEY not configured. Using existing transcription if available.',
        engine: 'none',
      },
    }
  }

  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 90 } })

  return {
    success: true,
    outputData: { engine: 'elevenlabs-scribe', wordCount: source.wordCount || 0 },
  }
}

async function processDerivativeJob(job: { id: string; inputData: string | null }): Promise<JobResult> {
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 50 } })

  // Stub — actual generation handled by derivative-generator.ts in Session 3
  return {
    success: true,
    outputData: { message: 'Derivative generation — engine not yet connected' },
  }
}

async function processTranslationJob(job: { id: string; inputData: string | null }): Promise<JobResult> {
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 50 } })

  // Stub — actual translation handled by translation-engine.ts in Session 3
  return {
    success: true,
    outputData: { message: 'Translation — engine not yet connected' },
  }
}

async function processImageJob(job: { id: string; inputData: string | null }): Promise<JobResult> {
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 50 } })

  // Stub — actual image generation handled by image-generator.ts in Session 3
  return {
    success: true,
    outputData: { message: 'Image generation — engine not yet connected' },
  }
}

async function processBatchJob(job: { id: string; sourceContentId: string | null; inputData: string | null }): Promise<JobResult> {
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 10 } })

  // Batch repurpose: transcribe → generate derivatives → translate all
  // This orchestrates the full pipeline. Stubs for now.
  await prisma.processingJob.update({ where: { id: job.id }, data: { progress: 50 } })

  return {
    success: true,
    outputData: { message: 'Batch repurpose — pipeline not yet connected' },
  }
}

async function updateJobMetrics(success: boolean) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.repurposingMetric.upsert({
    where: { date: today },
    create: {
      date: today,
      jobsProcessed: success ? 1 : 0,
      jobsFailed: success ? 0 : 1,
      successRate: success ? 100 : 0,
    },
    update: {
      jobsProcessed: success ? { increment: 1 } : undefined,
      jobsFailed: success ? undefined : { increment: 1 },
    },
  })
}
