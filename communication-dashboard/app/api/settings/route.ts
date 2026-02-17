// Settings API
// GET: System configuration and stats

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [
      contactCount,
      activeContactCount,
      campaignCount,
      segmentCount,
      templateCount,
      sequenceCount,
      broadcastCount,
      deliveryCount,
      alertCount,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { isActive: true } }),
      prisma.campaign.count(),
      prisma.segment.count(),
      prisma.template.count({ where: { isActive: true } }),
      prisma.sequence.count(),
      prisma.broadcast.count(),
      prisma.deliveryLog.count(),
      prisma.alert.count({ where: { isRead: false } }),
    ])

    return NextResponse.json({
      system: {
        version: '1.0.0',
        name: 'Communication Hub',
        framework: 'Next.js 14',
        database: 'SQLite + Prisma',
      },
      webhooks: {
        deliveryCallback: '/api/webhooks/delivery-status',
        campaignFromDrive: '/api/webhooks/campaign-from-drive',
        sequenceTrigger: '/api/webhooks/sequence-trigger',
        pabblyEmailUrl: process.env.PABBLY_WEBHOOK_EMAIL ? 'configured' : 'not set',
        pabblyWhatsappUrl: process.env.PABBLY_WEBHOOK_WHATSAPP ? 'configured' : 'not set',
        pabblySmsUrl: process.env.PABBLY_WEBHOOK_SMS ? 'configured' : 'not set',
        pabblyTelegramUrl: process.env.PABBLY_WEBHOOK_TELEGRAM ? 'configured' : 'not set',
        pabblySignalUrl: process.env.PABBLY_WEBHOOK_SIGNAL ? 'configured' : 'not set',
        pabblySocialUrl: process.env.PABBLY_WEBHOOK_SOCIAL ? 'configured' : 'not set',
      },
      ai: {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not set',
        model: 'claude-haiku-4-5-20251001',
        channelAdaptation: process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled (using fallback)',
        translation: process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled (using fallback)',
      },
      stats: {
        contacts: { total: contactCount, active: activeContactCount },
        campaigns: campaignCount,
        segments: segmentCount,
        templates: templateCount,
        sequences: sequenceCount,
        broadcasts: broadcastCount,
        deliveries: deliveryCount,
        unresolvedAlerts: alertCount,
      },
      channels: ['email', 'sms', 'whatsapp', 'telegram', 'signal', 'social_media'],
      deliveryTools: {
        email: 'Gmail (slow drip via Pabbly)',
        whatsapp: 'Ubot Studio (WhatsApp Web, one-by-one)',
        telegram: 'Telegram Bot API (free)',
        signal: 'Ubot Studio (Signal Desktop, one-by-one)',
        sms: 'Gmail carrier gateways / Google Voice',
        social_media: 'Followr / Robomotion',
      },
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}
