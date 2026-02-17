// Pabbly Connect Integration
// Fires webhooks for inter-pillar communication via Pabbly Connect

import { prisma } from './prisma'

interface PabblyResponse {
  success: boolean
  error?: string
}

// Outbound webhook URL environment variables
const WEBHOOK_VARS: Record<string, string> = {
  to_repurposing: 'PABBLY_WEBHOOK_TO_REPURPOSING',
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
 * Send finalized content to the Repurposing Dashboard (Pillar 2)
 */
export async function sendToRepurposing(content: {
  contentId: string
  title: string
  contentType: string
  mediaType: string
  language: string
  body?: string | null
  sourceUrl?: string | null
  driveFileId?: string | null
  durationSeconds?: number | null
  wordCount?: number | null
  tags?: string | null
  metadata?: string | null
}) {
  let parsedTags = undefined
  try {
    parsedTags = content.tags ? JSON.parse(content.tags) : undefined
  } catch { /* ignore */ }

  let parsedMetadata = undefined
  try {
    parsedMetadata = content.metadata ? JSON.parse(content.metadata) : undefined
  } catch { /* ignore */ }

  return firePabblyWebhook(
    'to_repurposing',
    {
      contentId: content.contentId,
      title: content.title,
      contentType: content.contentType,
      mediaType: content.mediaType,
      language: content.language,
      body: content.body || undefined,
      sourceUrl: content.sourceUrl || undefined,
      driveFileId: content.driveFileId || undefined,
      durationSeconds: content.durationSeconds || undefined,
      wordCount: content.wordCount || undefined,
      tags: parsedTags,
      metadata: parsedMetadata,
    },
    'ROUTE-ContentCreation-to-Repurposing',
    'content_sent',
    content.contentId
  )
}
