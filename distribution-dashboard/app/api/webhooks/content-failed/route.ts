// POST /api/webhooks/content-failed
// Webhook endpoint for failed platform posts
// Called by Pabbly Connect when content fails to post to a platform

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import {
  getOrCreateContentItem,
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
      'errorMessage',
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
      errorMessage,
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

    // Update ContentItem status to failed if no successful posts yet
    if (contentItem.platformsCompleted === 0) {
      await prisma.contentItem.update({
        where: { id: contentItem.id },
        data: { status: 'failed' },
      })
    }

    // Create DistributionLog entry for failure
    const distributionLog = await prisma.distributionLog.create({
      data: {
        contentItemId: contentItem.id,
        platform,
        tier,
        managementTool,
        status: 'failed',
        errorMessage,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Update platform health
    await updatePlatformHealth(platform, tier, false, managementTool, responseTimeMs)

    // Update pipeline metrics
    await updatePipelineMetrics(tier, false)

    // Create alert for the failure
    const alert = await prisma.alert.create({
      data: {
        severity: 'error',
        category: 'platform_failure',
        message: `Failed to post content to ${platform}`,
        details: JSON.stringify({
          contentId,
          contentTitle: title,
          platform,
          tier,
          errorMessage,
          managementTool,
        }),
        relatedContentId: contentId,
        relatedPlatform: platform,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Failure logged successfully',
        data: {
          contentItemId: contentItem.id,
          distributionLogId: distributionLog.id,
          alertId: alert.id,
          platformsCompleted: contentItem.platformsCompleted,
          platformsTargeted: contentItem.platformsTargeted,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing content-failed webhook:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
