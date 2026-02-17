// Campaign Approve API
// POST: Approve a campaign for sending

import { NextRequest, NextResponse } from 'next/server'
import { updateCampaignStatus } from '@/lib/campaign-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { approvedBy, action } = body

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      // Reject back to draft
      const success = await updateCampaignStatus(params.id, 'draft')
      if (!success) {
        return NextResponse.json(
          { error: `Cannot reject campaign in status: ${campaign.status}` },
          { status: 400 }
        )
      }
      return NextResponse.json({ status: 'draft', message: 'Campaign rejected to draft' })
    }

    // Approve flow: move through pending_approval if needed, then to approved
    if (campaign.status === 'draft') {
      // Skip pending_approval step and go straight to approved
      await updateCampaignStatus(params.id, 'pending_approval')
    }

    const success = await updateCampaignStatus(params.id, 'approved', {
      approvedBy: approvedBy || 'system',
    })

    if (!success) {
      return NextResponse.json(
        { error: `Cannot approve campaign in status: ${campaign.status}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 'approved',
      approvedBy: approvedBy || 'system',
      message: 'Campaign approved',
    })
  } catch (error) {
    console.error('Campaign approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve campaign' },
      { status: 500 }
    )
  }
}
