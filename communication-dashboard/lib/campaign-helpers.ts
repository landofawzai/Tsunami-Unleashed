// Campaign Helpers - Business logic for campaign version generation and management

import { prisma } from './prisma'
import { adaptForChannel } from './channel-adapter'
import { translateMessage } from './translator'

/**
 * Generate CampaignVersion records for each channel+language combination
 * This is the core "compose once, adapt everywhere" function
 */
export async function generateCampaignVersions(
  campaignId: string,
  channels: string[],
  languages: string[]
): Promise<{ created: number; errors: string[] }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) {
    return { created: 0, errors: [`Campaign ${campaignId} not found`] }
  }

  let created = 0
  const errors: string[] = []

  for (const channel of channels) {
    for (const language of languages) {
      try {
        // Step 1: Translate if needed
        let bodyForChannel = campaign.body
        if (language !== campaign.language) {
          const translation = await translateMessage(
            campaign.body,
            campaign.language,
            language,
            campaignId
          )
          bodyForChannel = translation.text
        }

        // Step 2: Adapt for channel
        const adaptation = await adaptForChannel(bodyForChannel, channel, {
          campaignType: campaign.type,
          subject: campaign.title,
        })

        // Step 3: Upsert the CampaignVersion
        await prisma.campaignVersion.upsert({
          where: {
            campaignId_channel_language: {
              campaignId,
              channel,
              language,
            },
          },
          create: {
            campaignId,
            channel,
            language,
            subject: adaptation.subject || null,
            body: adaptation.body,
            isAiGenerated: adaptation.isAiGenerated,
          },
          update: {
            subject: adaptation.subject || null,
            body: adaptation.body,
            isAiGenerated: adaptation.isAiGenerated,
          },
        })

        created++
      } catch (error) {
        const msg = `Failed to generate version for ${channel}/${language}: ${error}`
        console.error(msg)
        errors.push(msg)
      }
    }
  }

  return { created, errors }
}

/**
 * Get all versions for a campaign, organized for preview
 */
export async function getCampaignPreview(campaignId: string): Promise<{
  campaign: {
    id: string
    title: string
    type: string
    body: string
    language: string
    status: string
  } | null
  versions: {
    channel: string
    language: string
    subject: string | null
    body: string
    isAiGenerated: boolean
  }[]
  channelCount: number
  languageCount: number
}> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      type: true,
      body: true,
      language: true,
      status: true,
    },
  })

  if (!campaign) {
    return { campaign: null, versions: [], channelCount: 0, languageCount: 0 }
  }

  const versions = await prisma.campaignVersion.findMany({
    where: { campaignId },
    select: {
      channel: true,
      language: true,
      subject: true,
      body: true,
      isAiGenerated: true,
    },
    orderBy: [{ channel: 'asc' }, { language: 'asc' }],
  })

  const uniqueChannels = new Set(versions.map((v) => v.channel))
  const uniqueLanguages = new Set(versions.map((v) => v.language))

  return {
    campaign,
    versions,
    channelCount: uniqueChannels.size,
    languageCount: uniqueLanguages.size,
  }
}

/**
 * Update campaign status with validation
 */
export async function updateCampaignStatus(
  campaignId: string,
  newStatus: string,
  extra?: { approvedBy?: string; sentAt?: Date }
): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) return false

  // Status transition validation
  const validTransitions: Record<string, string[]> = {
    draft: ['pending_approval', 'approved'], // Can skip approval for urgent
    pending_approval: ['approved', 'draft'], // Can reject back to draft
    approved: ['scheduled', 'sending'], // Can schedule or send immediately
    scheduled: ['sending', 'approved'], // Can cancel schedule
    sending: ['sent', 'failed', 'partial'],
    sent: [], // Terminal state
    failed: ['draft'], // Can retry
    partial: ['sending'], // Can retry remaining
  }

  const allowed = validTransitions[campaign.status] || []
  if (!allowed.includes(newStatus)) {
    console.warn(
      `Invalid status transition: ${campaign.status} → ${newStatus}`
    )
    return false
  }

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'approved' && extra?.approvedBy) {
    updateData.approvedBy = extra.approvedBy
    updateData.approvedAt = new Date()
  }

  if (newStatus === 'sent' || newStatus === 'sending') {
    updateData.sentAt = extra?.sentAt || new Date()
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: updateData,
  })

  return true
}

/**
 * Update daily communication metrics
 */
export async function updateCommunicationMetrics(
  updates: {
    messagesSent?: number
    messagesDelivered?: number
    messagesFailed?: number
    messagesOpened?: number
    campaignsSent?: number
    urgentAlertsSent?: number
    prayerRequestsSent?: number
  }
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const metric = await prisma.communicationMetric.upsert({
    where: { date: today },
    create: {
      date: today,
      messagesSent: updates.messagesSent || 0,
      messagesDelivered: updates.messagesDelivered || 0,
      messagesFailed: updates.messagesFailed || 0,
      messagesOpened: updates.messagesOpened || 0,
      campaignsSent: updates.campaignsSent || 0,
      urgentAlertsSent: updates.urgentAlertsSent || 0,
      prayerRequestsSent: updates.prayerRequestsSent || 0,
    },
    update: {
      messagesSent: updates.messagesSent
        ? { increment: updates.messagesSent }
        : undefined,
      messagesDelivered: updates.messagesDelivered
        ? { increment: updates.messagesDelivered }
        : undefined,
      messagesFailed: updates.messagesFailed
        ? { increment: updates.messagesFailed }
        : undefined,
      messagesOpened: updates.messagesOpened
        ? { increment: updates.messagesOpened }
        : undefined,
      campaignsSent: updates.campaignsSent
        ? { increment: updates.campaignsSent }
        : undefined,
      urgentAlertsSent: updates.urgentAlertsSent
        ? { increment: updates.urgentAlertsSent }
        : undefined,
      prayerRequestsSent: updates.prayerRequestsSent
        ? { increment: updates.prayerRequestsSent }
        : undefined,
    },
  })

  // Recalculate rates
  const updated = await prisma.communicationMetric.findUnique({
    where: { date: today },
  })

  if (updated && updated.messagesSent > 0) {
    const deliveryRate =
      (updated.messagesDelivered / updated.messagesSent) * 100
    const openRate =
      updated.messagesDelivered > 0
        ? (updated.messagesOpened / updated.messagesDelivered) * 100
        : 0

    await prisma.communicationMetric.update({
      where: { date: today },
      data: { deliveryRate, openRate },
    })
  }
}

/**
 * Generate a system alert
 */
export async function generateAlert(
  severity: string,
  category: string,
  message: string,
  details?: Record<string, unknown>
): Promise<void> {
  await prisma.alert.create({
    data: {
      severity,
      category,
      message,
      details: details ? JSON.stringify(details) : null,
    },
  })
}
