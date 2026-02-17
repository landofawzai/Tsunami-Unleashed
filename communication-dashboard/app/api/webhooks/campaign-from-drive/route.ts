// Webhook: Campaign from Google Drive
// Called by Pabbly Connect when a new document is dropped in Communication/Outbound/
// Creates a campaign in "pending_approval" status for review in the dashboard

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAlert } from '@/lib/campaign-helpers'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { title, content, type, language, fileName, driveFileId } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    const validTypes = ['update', 'prayer', 'urgent', 'field_notice', 'announcement']
    const campaignType = validTypes.includes(type) ? type : 'update'

    // Create campaign in pending_approval status
    const campaign = await prisma.campaign.create({
      data: {
        title,
        type: campaignType,
        body: content,
        status: 'pending_approval',
        language: language || 'en',
        createdBy: 'Google Drive',
        metadata: JSON.stringify({
          source: 'google_drive',
          fileName: fileName || null,
          driveFileId: driveFileId || null,
          importedAt: new Date().toISOString(),
        }),
      },
    })

    // Generate an info alert so the dashboard shows the new campaign
    await generateAlert(
      'info',
      'system_error', // Using existing category
      `New campaign imported from Google Drive: "${title}" — awaiting approval`,
      { campaignId: campaign.id, source: 'google_drive', fileName }
    )

    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaign.id,
        title: campaign.title,
        type: campaign.type,
        status: campaign.status,
      },
    })
  } catch (error) {
    console.error('Campaign from Drive webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
