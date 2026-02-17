// Pabbly Connect Integration
// Fires webhooks to Pabbly for message delivery via Gmail, Ubot Studio, Telegram Bot, etc.

interface DeliveryPayload {
  broadcastId: string
  campaignId: string
  contactId: string
  channel: string
  recipientEmail?: string
  recipientPhone?: string
  recipientWhatsapp?: string
  recipientTelegram?: string
  recipientSignal?: string
  subject?: string
  body: string
  language: string
  contactName: string
  priority: string
}

interface PabblyResponse {
  success: boolean
  error?: string
}

// Environment variable keys for each channel's Pabbly webhook URL
const CHANNEL_WEBHOOK_VARS: Record<string, string> = {
  email: 'PABBLY_WEBHOOK_EMAIL',
  whatsapp: 'PABBLY_WEBHOOK_WHATSAPP',
  telegram: 'PABBLY_WEBHOOK_TELEGRAM',
  signal: 'PABBLY_WEBHOOK_SIGNAL',
  sms: 'PABBLY_WEBHOOK_SMS',
  social_media: 'PABBLY_WEBHOOK_SOCIAL',
}

/**
 * Fire a Pabbly webhook to deliver a message through a specific channel
 * Pabbly then routes to the appropriate tool (Gmail, Ubot Studio, Telegram Bot, etc.)
 */
export async function firePabblyWebhook(
  payload: DeliveryPayload
): Promise<PabblyResponse> {
  const webhookVar = CHANNEL_WEBHOOK_VARS[payload.channel]
  if (!webhookVar) {
    return { success: false, error: `Unknown channel: ${payload.channel}` }
  }

  const webhookUrl = process.env[webhookVar]
  if (!webhookUrl) {
    // In development/testing, log the payload instead of sending
    console.log(
      `[Pabbly] No webhook URL for ${payload.channel} (${webhookVar} not set). Payload:`,
      JSON.stringify({
        to: payload.recipientEmail || payload.recipientPhone || payload.recipientWhatsapp || payload.recipientTelegram || payload.recipientSignal,
        channel: payload.channel,
        subject: payload.subject,
        bodyLength: payload.body.length,
        contactName: payload.contactName,
      })
    )
    // Return success in dev mode so the pipeline continues
    return { success: true }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Pabbly webhook returned ${response.status}: ${response.statusText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Pabbly webhook failed: ${error}`,
    }
  }
}

/**
 * Build a delivery payload for a specific contact and channel
 */
export function buildDeliveryPayload(
  broadcastId: string,
  campaignId: string,
  contact: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    telegram?: string | null
    signal?: string | null
    language: string
  },
  channel: string,
  subject: string | undefined,
  body: string,
  priority: string
): DeliveryPayload {
  return {
    broadcastId,
    campaignId,
    contactId: contact.id,
    channel,
    recipientEmail: contact.email || undefined,
    recipientPhone: contact.phone || undefined,
    recipientWhatsapp: contact.whatsapp || undefined,
    recipientTelegram: contact.telegram || undefined,
    recipientSignal: contact.signal || undefined,
    subject,
    body,
    language: contact.language,
    contactName: contact.name,
    priority,
  }
}

/**
 * Check if a contact has the required channel info for delivery
 */
export function canDeliverToChannel(
  contact: {
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    telegram?: string | null
    signal?: string | null
  },
  channel: string
): boolean {
  switch (channel) {
    case 'email':
      return !!contact.email
    case 'sms':
      return !!contact.phone
    case 'whatsapp':
      return !!contact.whatsapp
    case 'telegram':
      return !!contact.telegram
    case 'signal':
      return !!contact.signal
    case 'social_media':
      return true // Social media posts don't need per-contact info
    default:
      return false
  }
}
