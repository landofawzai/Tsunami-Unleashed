// Campaign Adapt API
// POST: Trigger AI channel adaptation for a campaign

import { NextRequest, NextResponse } from 'next/server'
import { generateCampaignVersions } from '@/lib/campaign-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { channels, languages } = body

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: 'channels array is required' },
        { status: 400 }
      )
    }

    const validChannels = ['email', 'sms', 'whatsapp', 'telegram', 'signal', 'social_media']
    const invalidChannels = channels.filter((ch: string) => !validChannels.includes(ch))
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { error: `Invalid channels: ${invalidChannels.join(', ')}` },
        { status: 400 }
      )
    }

    const targetLanguages = languages || ['en']

    const result = await generateCampaignVersions(
      params.id,
      channels,
      targetLanguages
    )

    return NextResponse.json({
      success: true,
      versionsCreated: result.created,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Campaign adapt error:', error)
    return NextResponse.json(
      { error: 'Failed to adapt campaign' },
      { status: 500 }
    )
  }
}
