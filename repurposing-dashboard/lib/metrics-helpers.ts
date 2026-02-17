// Metrics Helpers — Daily rollup upserts and alert generation
// Follows the same pattern as distribution-dashboard/lib/webhook-helpers.ts

import { prisma } from './prisma'

/**
 * Update daily repurposing metrics
 */
export async function updateRepurposingMetrics(updates: {
  sourcesIngested?: number
  derivativesGenerated?: number
  translationsCompleted?: number
  aiTokensUsed?: number
  scribeMinutes?: number
  imagesGenerated?: number
  sentToDistribution?: number
  derivativeType?: string
  language?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.repurposingMetric.findUnique({ where: { date: today } })

  // Build derivative breakdown update
  let derivativeBreakdown = existing?.derivativeBreakdown
    ? JSON.parse(existing.derivativeBreakdown)
    : {}
  if (updates.derivativeType) {
    derivativeBreakdown[updates.derivativeType] = (derivativeBreakdown[updates.derivativeType] || 0) + 1
  }

  // Build language breakdown update
  let languageBreakdown = existing?.languageBreakdown
    ? JSON.parse(existing.languageBreakdown)
    : {}
  if (updates.language) {
    languageBreakdown[updates.language] = (languageBreakdown[updates.language] || 0) + 1
  }

  await prisma.repurposingMetric.upsert({
    where: { date: today },
    create: {
      date: today,
      sourcesIngested: updates.sourcesIngested || 0,
      derivativesGenerated: updates.derivativesGenerated || 0,
      translationsCompleted: updates.translationsCompleted || 0,
      aiTokensUsed: updates.aiTokensUsed || 0,
      scribeMinutes: updates.scribeMinutes || 0,
      imagesGenerated: updates.imagesGenerated || 0,
      sentToDistribution: updates.sentToDistribution || 0,
      derivativeBreakdown: JSON.stringify(derivativeBreakdown),
      languageBreakdown: JSON.stringify(languageBreakdown),
    },
    update: {
      sourcesIngested: updates.sourcesIngested ? { increment: updates.sourcesIngested } : undefined,
      derivativesGenerated: updates.derivativesGenerated ? { increment: updates.derivativesGenerated } : undefined,
      translationsCompleted: updates.translationsCompleted ? { increment: updates.translationsCompleted } : undefined,
      aiTokensUsed: updates.aiTokensUsed ? { increment: updates.aiTokensUsed } : undefined,
      scribeMinutes: updates.scribeMinutes ? { increment: updates.scribeMinutes } : undefined,
      imagesGenerated: updates.imagesGenerated ? { increment: updates.imagesGenerated } : undefined,
      sentToDistribution: updates.sentToDistribution ? { increment: updates.sentToDistribution } : undefined,
      derivativeBreakdown: JSON.stringify(derivativeBreakdown),
      languageBreakdown: JSON.stringify(languageBreakdown),
    },
  })

  // Recalculate success rate
  const metric = await prisma.repurposingMetric.findUnique({ where: { date: today } })
  if (metric) {
    const total = metric.jobsProcessed + metric.jobsFailed
    const successRate = total > 0 ? (metric.jobsProcessed / total) * 100 : 0
    await prisma.repurposingMetric.update({
      where: { date: today },
      data: { successRate },
    })
  }
}

/**
 * Generate an alert
 */
export async function generateAlert(
  severity: 'info' | 'warning' | 'error' | 'critical',
  category: string,
  message: string,
  details?: Record<string, unknown>,
  relatedContentId?: string
) {
  return prisma.alert.create({
    data: {
      severity,
      category,
      message,
      details: details ? JSON.stringify(details) : null,
      relatedContentId,
    },
  })
}

/**
 * Update language config translation count
 */
export async function incrementLanguageTranslationCount(languageCode: string) {
  const lang = await prisma.languageConfig.findUnique({ where: { code: languageCode } })
  if (lang) {
    await prisma.languageConfig.update({
      where: { code: languageCode },
      data: { totalTranslations: { increment: 1 } },
    })
  }
}
