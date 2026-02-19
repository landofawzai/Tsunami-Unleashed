// Telegram Subscriber Sync Webhook
// Called daily via Pabbly scheduler or manual cron.
// Polls the Telegram Bot API for new subscribers and auto-creates contacts.

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'
import { syncTelegramSubscribers } from '@/lib/telegram-sync'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const result = await syncTelegramSubscribers()

    return NextResponse.json({
      success: true,
      ...result,
      message: result.newContacts > 0
        ? `Synced ${result.newContacts} new Telegram subscriber(s)`
        : 'No new subscribers found',
    })
  } catch (error) {
    console.error('Telegram sync error:', error)
    return NextResponse.json(
      { error: 'Telegram sync failed' },
      { status: 500 }
    )
  }
}
