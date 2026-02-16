// POST /api/webhooks/content-posted
// Webhook endpoint for successful platform posts
// Called by Pabbly Connect when content successfully posts to a platform

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import {
  getOrCreateContentItem,
  checkAutoCompletion,
  updateTierCapacity,
  updatePlatformHealth,
  updatePipelineMetrics,
} from '@/lib/webhook-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'contentId',
      'title',
      'contentType',
      'tier',
      'platform',
      'managementTool',
    ]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      )
    }

    const {
      contentId,
      title,
      contentType,
      tier,
      platform,
      platformsTargeted,
      platformPostId,
      postUrl,
      managementTool,
      sourceUrl,
      metadata,
      responseTimeMs,
    } = body

    // Get or create ContentItem
    const contentItem = await getOrCreateContentItem({
      contentId,
      title,
      contentType,
      tier,
      platformsTargeted: platformsTargeted || 1,
      sourceUrl,
    })

    // Create DistributionLog entry
    const distributionLog = await prisma.distributionLog.create({
      data: {
        contentItemId: contentItem.id,
        platform,
        tier,
        managementTool,
        status: 'success',
        platformPostId,
        postUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Increment platformsCompleted
    const updatedContentItem = await prisma.contentItem.update({
      where: { id: contentItem.id },
      data: {
        platformsCompleted: { increment: 1 },
        status: 'in_progress',
      },
    })

    // Check for auto-completion
    const isCompleted = await checkAutoCompletion(contentItem.id)

    // Update tier capacity (only count unique content items)
    if (contentItem.platformsCompleted === 0) {
      await updateTierCapacity(tier, 1)
    }

    // Update platform health
    await updatePlatformHealth(platform, tier, true, managementTool, responseTimeMs)

    // Update pipeline metrics
    await updatePipelineMetrics(tier, true)

    return NextResponse.json(
      {
        success: true,
        message: 'Content posted successfully',
        data: {
          contentItemId: contentItem.id,
          distributionLogId: distributionLog.id,
          platformsCompleted: updatedContentItem.platformsCompleted,
          platformsTargeted: updatedContentItem.platformsTargeted,
          isCompleted,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing content-posted webhook:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
