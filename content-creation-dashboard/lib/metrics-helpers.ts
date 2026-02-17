// Metrics Helpers
// Daily metric upsert and alert generation

import { prisma } from './prisma'

interface MetricUpdates {
  contentPlanned?: number
  contentDrafted?: number
  contentFinalized?: number
  contentSent?: number
  reviewsCompleted?: number
  tasksCompleted?: number
}

/**
 * Update today's creation metrics (increment)
 */
export async function updateCreationMetrics(updates: MetricUpdates): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await prisma.creationMetric.upsert({
      where: { date: today },
      update: {
        contentPlanned: { increment: updates.contentPlanned || 0 },
        contentDrafted: { increment: updates.contentDrafted || 0 },
        contentFinalized: { increment: updates.contentFinalized || 0 },
        contentSent: { increment: updates.contentSent || 0 },
        reviewsCompleted: { increment: updates.reviewsCompleted || 0 },
        tasksCompleted: { increment: updates.tasksCompleted || 0 },
      },
      create: {
        date: today,
        contentPlanned: updates.contentPlanned || 0,
        contentDrafted: updates.contentDrafted || 0,
        contentFinalized: updates.contentFinalized || 0,
        contentSent: updates.contentSent || 0,
        reviewsCompleted: updates.reviewsCompleted || 0,
        tasksCompleted: updates.tasksCompleted || 0,
      },
    })
  } catch (error) {
    console.error('Metrics update error:', error)
  }
}

/**
 * Generate a system alert
 */
export async function generateAlert(
  severity: string,
  category: string,
  message: string,
  details?: Record<string, unknown>,
  relatedContentId?: string
): Promise<void> {
  try {
    await prisma.alert.create({
      data: {
        severity,
        category,
        message,
        details: details ? JSON.stringify(details) : null,
        relatedContentId,
      },
    })
  } catch (error) {
    console.error('Alert generation error:', error)
  }
}
