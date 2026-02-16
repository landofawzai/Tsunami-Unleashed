// Webhook Helper Functions
// Shared logic for webhook endpoints

import { prisma } from './prisma'

/**
 * Get or create a ContentItem by contentId
 */
export async function getOrCreateContentItem(data: {
  contentId: string
  title: string
  contentType: string
  tier: number
  platformsTargeted: number
  sourceUrl?: string
}) {
  let contentItem = await prisma.contentItem.findUnique({
    where: { contentId: data.contentId },
  })

  if (!contentItem) {
    contentItem = await prisma.contentItem.create({
      data: {
        contentId: data.contentId,
        title: data.title,
        contentType: data.contentType,
        tier: data.tier,
        platformsTargeted: data.platformsTargeted,
        platformsCompleted: 0,
        status: 'in_progress',
        sourceUrl: data.sourceUrl,
      },
    })
  }

  return contentItem
}

/**
 * Check if content item should be auto-completed
 * Returns true if platformsCompleted >= platformsTargeted
 */
export async function checkAutoCompletion(contentItemId: string): Promise<boolean> {
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
  })

  if (!contentItem) return false

  if (contentItem.platformsCompleted >= contentItem.platformsTargeted) {
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })
    return true
  }

  return false
}

/**
 * Update tier capacity (used/available slots)
 */
export async function updateTierCapacity(tier: number, increment: number = 1) {
  const capacity = await prisma.tierCapacity.findUnique({
    where: { tier },
  })

  if (!capacity) {
    console.warn(`Tier capacity not found for tier ${tier}`)
    return
  }

  const newUsedSlots = capacity.usedSlots + increment
  const newAvailableSlots =
    capacity.totalSlots === -1
      ? -1 // Unlimited
      : capacity.totalSlots - newUsedSlots - capacity.reservedSlots

  await prisma.tierCapacity.update({
    where: { tier },
    data: {
      usedSlots: newUsedSlots,
      availableSlots: newAvailableSlots,
    },
  })

  // Generate alert if Tier 1 is running low
  if (tier === 1 && newAvailableSlots <= 20 && newAvailableSlots > 0) {
    await prisma.alert.create({
      data: {
        severity: newAvailableSlots <= 10 ? 'critical' : 'warning',
        category: 'capacity_warning',
        message: `Tier 1 capacity low: ${newAvailableSlots} slots remaining`,
        details: JSON.stringify({
          tier: 1,
          usedSlots: newUsedSlots,
          availableSlots: newAvailableSlots,
          totalSlots: capacity.totalSlots,
        }),
      },
    })
  }
}

/**
 * Update platform health based on success/failure
 */
export async function updatePlatformHealth(
  platform: string,
  tier: number,
  success: boolean,
  managementTool: string,
  responseTimeMs?: number
) {
  const platformHealth = await prisma.platformHealth.upsert({
    where: { platform },
    create: {
      platform,
      tier,
      status: success ? 'healthy' : 'degraded',
      managementTool,
      lastSuccessfulPost: success ? new Date() : null,
      lastFailedPost: success ? null : new Date(),
      failureCount24h: success ? 0 : 1,
      responseTimeMs,
    },
    update: {
      status: success ? 'healthy' : 'degraded',
      lastSuccessfulPost: success ? new Date() : undefined,
      lastFailedPost: success ? undefined : new Date(),
      failureCount24h: success ? 0 : { increment: 1 },
      responseTimeMs,
      lastChecked: new Date(),
    },
  })

  // Generate alert if platform is experiencing issues
  if (!success && platformHealth.failureCount24h + 1 >= 5) {
    await prisma.alert.create({
      data: {
        severity: platformHealth.failureCount24h + 1 >= 10 ? 'critical' : 'warning',
        category: 'platform_failure',
        message: `Platform ${platform} has ${platformHealth.failureCount24h + 1} failures in 24h`,
        details: JSON.stringify({
          platform,
          tier,
          failureCount: platformHealth.failureCount24h + 1,
          managementTool,
        }),
        relatedPlatform: platform,
      },
    })
  }
}

/**
 * Update daily pipeline metrics
 */
export async function updatePipelineMetrics(tier: number, success: boolean) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const metric = await prisma.pipelineMetric.upsert({
    where: { date: today },
    create: {
      date: today,
      tier1Posts: tier === 1 ? 1 : 0,
      tier2Posts: tier === 2 ? 1 : 0,
      tier3Posts: tier === 3 ? 1 : 0,
      totalPosts: 1,
      successfulPosts: success ? 1 : 0,
      failedPosts: success ? 0 : 1,
      successRate: success ? 100 : 0,
    },
    update: {
      tier1Posts: tier === 1 ? { increment: 1 } : undefined,
      tier2Posts: tier === 2 ? { increment: 1 } : undefined,
      tier3Posts: tier === 3 ? { increment: 1 } : undefined,
      totalPosts: { increment: 1 },
      successfulPosts: success ? { increment: 1 } : undefined,
      failedPosts: success ? undefined : { increment: 1 },
    },
  })

  // Recalculate success rate
  const updatedMetric = await prisma.pipelineMetric.findUnique({
    where: { date: today },
  })

  if (updatedMetric) {
    const successRate =
      updatedMetric.totalPosts > 0
        ? (updatedMetric.successfulPosts / updatedMetric.totalPosts) * 100
        : 0

    await prisma.pipelineMetric.update({
      where: { date: today },
      data: { successRate },
    })
  }
}
