// Channel Adapter - Adapts a single message for each delivery channel
// Uses Claude Haiku for AI-powered adaptation with graceful fallback

interface AdaptOptions {
  campaignType?: string // update|prayer|urgent|field_notice|announcement
  subject?: string      // Email subject (passed through for email channel)
}

interface ChannelAdaptation {
  channel: string
  subject?: string
  body: string
  isAiGenerated: boolean
}

const CHANNEL_PROMPTS: Record<string, string> = {
  email: `Adapt this message for email delivery. Include a warm greeting, the full message body with proper paragraph breaks, and a professional sign-off from "Tsunami Unleashed Team". Keep all the substance — email can be longer. Return ONLY the adapted message text, no explanation.`,

  sms: `Adapt this message for SMS (160 character max). Extract only the most critical information. No greeting or sign-off. Be direct and concise. End with "-TU" as the sender tag. Return ONLY the adapted SMS text, no explanation.`,

  whatsapp: `Adapt this message for WhatsApp. Use WhatsApp formatting: *bold* for emphasis, line breaks for readability. Keep it concise but complete (under 500 characters). Use appropriate tone — warm but brief. No formal greeting or sign-off needed. Return ONLY the adapted WhatsApp text, no explanation.`,

  telegram: `Adapt this message for Telegram. Use Markdown formatting: **bold**, line breaks, bullet points with - dashes. Keep concise (under 400 characters). Direct and informative tone. Return ONLY the adapted Telegram text, no explanation.`,

  signal: `Adapt this message for Signal. Plain text only, no special formatting. Keep concise (under 300 characters). Direct, personal tone. Return ONLY the adapted Signal text, no explanation.`,

  social_media: `Adapt this message as a social media post. Keep under 280 characters. Make it engaging and shareable. No hashtags unless highly relevant. Return ONLY the adapted social media text, no explanation.`,
}

/**
 * Adapt a master message body for a specific channel using AI
 * Falls back to returning the master body as-is if AI is unavailable
 */
export async function adaptForChannel(
  masterBody: string,
  channel: string,
  options?: AdaptOptions
): Promise<ChannelAdaptation> {
  const prompt = CHANNEL_PROMPTS[channel]

  if (!prompt) {
    return { channel, body: masterBody, isAiGenerated: false }
  }

  // For email, pass through subject if provided
  if (channel === 'email' && options?.subject) {
    const adapted = await callAI(prompt, masterBody, options.campaignType)
    return {
      channel,
      subject: options.subject,
      body: adapted.body,
      isAiGenerated: adapted.isAi,
    }
  }

  const adapted = await callAI(prompt, masterBody, options?.campaignType)
  return {
    channel,
    body: adapted.body,
    isAiGenerated: adapted.isAi,
  }
}

/**
 * Adapt a master message for all specified channels at once
 * Returns a map of channel → adaptation
 */
export async function adaptAllChannels(
  masterBody: string,
  channels: string[],
  options?: AdaptOptions
): Promise<Map<string, ChannelAdaptation>> {
  const results = new Map<string, ChannelAdaptation>()

  // Run all adaptations in parallel
  const adaptations = await Promise.all(
    channels.map((channel) => adaptForChannel(masterBody, channel, options))
  )

  for (const adaptation of adaptations) {
    results.set(adaptation.channel, adaptation)
  }

  return results
}

/**
 * Call the AI API for message adaptation
 * Returns the adapted text or falls back to original if AI unavailable
 */
async function callAI(
  systemPrompt: string,
  messageBody: string,
  campaignType?: string
): Promise<{ body: string; isAi: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — returning original message body')
    return { body: messageBody, isAi: false }
  }

  try {
    const contextPrefix = campaignType
      ? `This is a "${campaignType}" type ministry communication.\n\n`
      : ''

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${contextPrefix}${messageBody}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`AI API error: ${response.status} ${response.statusText}`)
      return { body: messageBody, isAi: false }
    }

    const data = await response.json()
    const adaptedText = data.content?.[0]?.text?.trim()

    if (!adaptedText) {
      return { body: messageBody, isAi: false }
    }

    return { body: adaptedText, isAi: true }
  } catch (error) {
    console.error('AI adaptation failed, using original:', error)
    return { body: messageBody, isAi: false }
  }
}

/**
 * Get the list of supported channels
 */
export function getSupportedChannels(): string[] {
  return Object.keys(CHANNEL_PROMPTS)
}
