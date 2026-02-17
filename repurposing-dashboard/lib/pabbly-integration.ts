// Pabbly Connect Integration
// Fires webhooks for inter-pillar communication via Pabbly Connect

import { prisma } from './prisma'

interface PabblyResponse {
  success: boolean
  error?: string
}

// Outbound webhook URL environment variables
const WEBHOOK_VARS: Record<string, string> = {
  derivative_created: 'PABBLY_WEBHOOK_DERIVATIVE_CREATED',
  translation_ready: 'PABBLY_WEBHOOK_TRANSLATION_READY',
  to_distribution: 'PABBLY_WEBHOOK_TO_DISTRIBUTION',
}

/**
 * Fire a Pabbly webhook
 */
async function firePabblyWebhook(
  webhookType: string,
  payload: Record<string, unknown>,
  workflowName: string,
  eventType: string,
  relatedContentId?: string
): Promise<PabblyResponse> {
  const webhookVar = WEBHOOK_VARS[webhookType]
  if (!webhookVar) {
    return { success: false, error: `Unknown webhook type: ${webhookType}` }
  }

  const webhookUrl = process.env[webhookVar]
  if (!webhookUrl) {
    // Dev mode: log instead of sending
    console.log(
      `[Pabbly] ${workflowName} — No webhook URL (${webhookVar} not set). Payload:`,
      JSON.stringify(payload, null, 2).substring(0, 200)
    )

    // Log the event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'outbound',
        workflowName,
        eventType,
        payload: JSON.stringify(payload),
        status: 'sent',
        relatedContentId,
      },
    })

    return { success: true }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const status = response.ok ? 'sent' : 'failed'
    const errorMessage = response.ok ? undefined : `Pabbly returned ${response.status}`

    // Log the event
    await prisma.pabblyEvent.create({
      data: {
        direction: 'outbound',
        workflowName,
        eventType,
        payload: JSON.stringify(payload),
        status,
        relatedContentId,
        errorMessage,
      },
    })

    if (!response.ok) {
      return { success: false, error: errorMessage }
    }

    return { success: true }
  } catch (error) {
    await prisma.pabblyEvent.create({
      data: {
        direction: 'outbound',
        workflowName,
        eventType,
        payload: JSON.stringify(payload),
        status: 'failed',
        relatedContentId,
        errorMessage: String(error),
      },
    })

    return { success: false, error: `Pabbly webhook failed: ${error}` }
  }
}

/**
 * Notify that a derivative was created
 */
export async function notifyDerivativeCreated(derivative: {
  contentId: string
  parentContentId: string
  derivativeType: string
  title: string
  language: string
}) {
  return firePabblyWebhook(
    'derivative_created',
    derivative,
    'ROUTE-Derivatives-to-Distribution',
    'derivative_created',
    derivative.contentId
  )
}

/**
 * Notify that a translation is ready (approved)
 */
export async function notifyTranslationReady(translation: {
  contentId: string
  parentContentId: string
  targetLanguage: string
  title: string
}) {
  return firePabblyWebhook(
    'translation_ready',
    translation,
    'ROUTE-Translations-to-Distribution',
    'translation_ready',
    translation.contentId
  )
}

/**
 * Send a derivative or translation to the Distribution Dashboard
 */
export async function sendToDistribution(content: {
  contentId: string
  parentContentId: string
  title: string
  contentType: string
  language: string
  body: string
  derivativeType?: string
}) {
  return firePabblyWebhook(
    'to_distribution',
    {
      ...content,
      source: 'repurposing-dashboard',
      tier: 2, // Derivatives go to Tier 2 (unlimited external feeds)
      platformsTargeted: 3, // Default estimate
    },
    'ROUTE-Derivatives-to-Distribution',
    'sent_to_distribution',
    content.contentId
  )
}
