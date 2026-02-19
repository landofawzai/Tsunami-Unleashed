// Telegram Subscriber Sync
// Polls the Telegram Bot API for new subscribers and auto-creates contacts.
// Called daily via the /api/webhooks/telegram-sync cron endpoint.

import { prisma } from './prisma'
import * as fs from 'fs'
import * as path from 'path'

const LAST_UPDATE_FILE = path.join(process.cwd(), '.last-telegram-update')

const DEFAULT_WELCOME = `Welcome to Tsunami Unleashed, {name}! You are now subscribed to receive updates, prayer requests, and ministry news via Telegram. God bless you!`

interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramUpdate {
  update_id: number
  message?: {
    from: TelegramUser
    chat: { id: number; type: string }
    text?: string
  }
}

function getLastUpdateId(): number {
  try {
    const data = fs.readFileSync(LAST_UPDATE_FILE, 'utf-8').trim()
    return parseInt(data, 10) || 0
  } catch {
    return 0
  }
}

function saveLastUpdateId(updateId: number): void {
  fs.writeFileSync(LAST_UPDATE_FILE, String(updateId), 'utf-8')
}

/**
 * Send a welcome message to a new Telegram subscriber
 */
async function sendWelcomeMessage(
  botToken: string,
  chatId: number,
  name: string
): Promise<void> {
  const template = process.env.TELEGRAM_WELCOME_MESSAGE || DEFAULT_WELCOME
  const text = template.replace('{name}', name)

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
  } catch (error) {
    console.error(`[Telegram Sync] Failed to send welcome to ${chatId}:`, error)
  }
}

/**
 * Poll Telegram for new subscribers and create contacts for each.
 * Returns stats on what was processed.
 */
export async function syncTelegramSubscribers(): Promise<{
  processed: number
  newContacts: number
  skipped: number
  errors: number
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return { processed: 0, newContacts: 0, skipped: 0, errors: 0 }
  }

  const lastUpdateId = getLastUpdateId()

  // Fetch updates since last sync
  const url = lastUpdateId
    ? `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&limit=100`
    : `https://api.telegram.org/bot${botToken}/getUpdates?limit=100`

  let updates: TelegramUpdate[]
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (!data.ok) {
      console.error('[Telegram Sync] getUpdates failed:', data.description)
      return { processed: 0, newContacts: 0, skipped: 0, errors: 1 }
    }
    updates = data.result || []
  } catch (error) {
    console.error('[Telegram Sync] Failed to fetch updates:', error)
    return { processed: 0, newContacts: 0, skipped: 0, errors: 1 }
  }

  if (updates.length === 0) {
    return { processed: 0, newContacts: 0, skipped: 0, errors: 0 }
  }

  // Deduplicate by chat ID — keep the latest info per user
  const uniqueUsers = new Map<number, TelegramUser>()
  let maxUpdateId = lastUpdateId

  for (const update of updates) {
    if (update.update_id > maxUpdateId) {
      maxUpdateId = update.update_id
    }
    if (update.message?.from && !update.message.from.is_bot) {
      uniqueUsers.set(update.message.from.id, update.message.from)
    }
  }

  let newContacts = 0
  let skipped = 0
  let errors = 0

  for (const [chatId, user] of uniqueUsers) {
    const chatIdStr = String(chatId)

    // Check if contact already exists with this Telegram chat ID
    const existing = await prisma.contact.findFirst({
      where: { telegram: chatIdStr },
    })

    if (existing) {
      skipped++
      continue
    }

    // Build contact name
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || `Telegram User ${chatId}`

    // Map Telegram language_code to our supported languages
    const language = user.language_code?.split('-')[0] || 'en'

    try {
      await prisma.contact.create({
        data: {
          name,
          telegram: chatIdStr,
          language,
          notes: user.username ? `Telegram: @${user.username}` : 'Added via Telegram bot sync',
        },
      })

      await sendWelcomeMessage(botToken, chatId, user.first_name || name)
      newContacts++
    } catch (error) {
      console.error(`[Telegram Sync] Failed to create contact for ${chatId}:`, error)
      errors++
    }
  }

  // Save the highest update_id so next sync starts after it
  if (maxUpdateId > lastUpdateId) {
    saveLastUpdateId(maxUpdateId)
  }

  console.log(
    `[Telegram Sync] Processed ${updates.length} updates: ${newContacts} new, ${skipped} existing, ${errors} errors`
  )

  return {
    processed: updates.length,
    newContacts,
    skipped,
    errors,
  }
}
