// Broadcast Engine - Handles sending campaigns to segments across channels
// Manages scheduling, timezone handling, and delivery orchestration

import { prisma } from './prisma'
import { firePabblyWebhook, buildDeliveryPayload, canDeliverToChannel } from './pabbly-integration'
import { updateCommunicationMetrics, generateAlert } from './campaign-helpers'

/**
 * Create a new broadcast for a campaign targeting a segment
 */
export async function createBroadcast(
  campaignId: string,
  segmentId: string,
  channels: string[],
  scheduledAt?: Date
): Promise<{ broadcastId: string; totalRecipients: number } | null> {
  // Count recipients in the segment who have at least one of the requested channels
  const contactSegments = await prisma.contactSegment.findMany({
    where: { segmentId },
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          phone: true,
          whatsapp: true,
          telegram: true,
          signal: true,
          isActive: true,
        },
      },
    },
  })

  // Filter to active contacts who can receive at least one channel
  const reachableContacts = contactSegments.filter(
    (cs) =>
      cs.contact.isActive &&
      channels.some((ch) => canDeliverToChannel(cs.contact, ch))
  )

  const broadcast = await prisma.broadcast.create({
    data: {
      campaignId,
      segmentId,
      channels: JSON.stringify(channels),
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'pending' : 'pending',
      totalRecipients: reachableContacts.length,
    },
  })

  return {
    broadcastId: broadcast.id,
    totalRecipients: reachableContacts.length,
  }
}

/**
 * Execute a broadcast - resolve contacts, create delivery logs, fire webhooks
 * This is the main send function
 */
export async function executeBroadcast(
  broadcastId: string
): Promise<{ sent: number; failed: number; skipped: number }> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: {
      campaign: {
        include: { versions: true },
      },
      segment: true,
    },
  })

  if (!broadcast) {
    throw new Error(`Broadcast ${broadcastId} not found`)
  }

  // Mark as sending
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'sending', sentAt: new Date() },
  })

  const channels: string[] = JSON.parse(broadcast.channels)

  // Get all contacts in the segment
  const contactSegments = await prisma.contactSegment.findMany({
    where: { segmentId: broadcast.segmentId },
    include: {
      contact: true,
    },
  })

  const activeContacts = contactSegments
    .filter((cs) => cs.contact.isActive)
    .map((cs) => cs.contact)

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const contact of activeContacts) {
    for (const channel of channels) {
      // Check if contact can receive on this channel
      if (!canDeliverToChannel(contact, channel)) {
        skipped++
        continue
      }

      // Find the best version for this contact's language and channel
      const version = findBestVersion(
        broadcast.campaign.versions,
        channel,
        contact.language
      )

      const body = version?.body || broadcast.campaign.body
      const subject = version?.subject || broadcast.campaign.title

      // Create delivery log entry
      const deliveryLog = await prisma.deliveryLog.create({
        data: {
          broadcastId,
          contactId: contact.id,
          channel,
          status: 'queued',
        },
      })

      // Fire Pabbly webhook for delivery
      const payload = buildDeliveryPayload(
        broadcastId,
        broadcast.campaignId,
        contact,
        channel,
        subject,
        body,
        broadcast.campaign.priority
      )

      const result = await firePabblyWebhook(payload)

      if (result.success) {
        await prisma.deliveryLog.update({
          where: { id: deliveryLog.id },
          data: { status: 'sent', sentAt: new Date() },
        })
        sent++
      } else {
        await prisma.deliveryLog.update({
          where: { id: deliveryLog.id },
          data: { status: 'failed', errorMessage: result.error },
        })
        failed++
      }
    }
  }

  // Update broadcast totals
  const finalStatus = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial'
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: finalStatus,
      delivered: sent,
      failed,
    },
  })

  // Update daily metrics
  await updateCommunicationMetrics({
    messagesSent: sent + failed,
    messagesDelivered: sent,
    messagesFailed: failed,
    campaignsSent: 1,
    urgentAlertsSent: broadcast.campaign.isUrgent ? 1 : 0,
    prayerRequestsSent: broadcast.campaign.type === 'prayer' ? 1 : 0,
  })

  // Generate alert if there were failures
  if (failed > 0) {
    await generateAlert(
      failed > sent ? 'error' : 'warning',
      'delivery_failure',
      `Broadcast to "${broadcast.segment.name}": ${failed} of ${sent + failed} deliveries failed`,
      { broadcastId, campaignId: broadcast.campaignId, sent, failed, skipped }
    )
  }

  return { sent, failed, skipped }
}

/**
 * Process urgent broadcast - bypasses scheduling, sends immediately to all specified segments
 */
export async function processUrgentBroadcast(
  campaignId: string,
  segmentIds: string[],
  channels: string[]
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const segmentId of segmentIds) {
    const result = await createBroadcast(campaignId, segmentId, channels)
    if (result) {
      const execution = await executeBroadcast(result.broadcastId)
      totalSent += execution.sent
      totalFailed += execution.failed
    }
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'sent', sentAt: new Date() },
  })

  return { totalSent, totalFailed }
}

/**
 * Adjust a scheduled time to a contact's timezone
 * Returns the UTC time that corresponds to the desired local time in the contact's timezone
 */
export function getTimezoneAdjustedTime(
  desiredLocalTime: Date,
  timezone: string | null
): Date {
  if (!timezone) return desiredLocalTime

  try {
    // Get the offset for the target timezone at the desired time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(desiredLocalTime)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')

    if (!offsetPart) return desiredLocalTime

    // Parse offset like "GMT+3" or "GMT-5:30"
    const offsetMatch = offsetPart.value.match(/GMT([+-]?)(\d+)(?::(\d+))?/)
    if (!offsetMatch) return desiredLocalTime

    const sign = offsetMatch[1] === '-' ? 1 : -1 // Reverse for UTC conversion
    const hours = parseInt(offsetMatch[2], 10)
    const minutes = parseInt(offsetMatch[3] || '0', 10)
    const totalOffsetMs = sign * (hours * 60 + minutes) * 60 * 1000

    return new Date(desiredLocalTime.getTime() + totalOffsetMs)
  } catch {
    return desiredLocalTime
  }
}

/**
 * Find the best CampaignVersion for a given channel and language
 * Prefers exact match, falls back to same channel in source language, then any version
 */
function findBestVersion(
  versions: { channel: string; language: string; subject: string | null; body: string }[],
  channel: string,
  language: string
): { subject: string | null; body: string } | null {
  // Exact match: same channel and language
  const exact = versions.find(
    (v) => v.channel === channel && v.language === language
  )
  if (exact) return exact

  // Same channel, default language (en)
  const channelDefault = versions.find(
    (v) => v.channel === channel && v.language === 'en'
  )
  if (channelDefault) return channelDefault

  // Same channel, any language
  const anyLang = versions.find((v) => v.channel === channel)
  if (anyLang) return anyLang

  return null
}
