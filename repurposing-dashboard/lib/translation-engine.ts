// Translation Engine — Three-Pass Translation Pipeline
// Uses Claude Haiku for AI translation with caching
// Pass 1: AI draft → Pass 2: Local speaker review → Pass 3: Theological review

import { prisma } from './prisma'
import { updateRepurposingMetrics, incrementLanguageTranslationCount } from './metrics-helpers'

// In-memory cache: key = `${derivativeId}-${language}`, value = translated text
const translationCache = new Map<string, string>()

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4)
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  mai: 'Maithili',
}

interface TranslationResult {
  success: boolean
  translationId?: string
  contentId?: string
  error?: string
}

/**
 * Translate a derivative into a target language (Pass 1: AI Draft)
 */
export async function translateDerivative(
  derivativeId: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const derivative = await prisma.derivative.findUnique({ where: { id: derivativeId } })
  if (!derivative) return { success: false, error: 'Derivative not found' }

  if (derivative.language === targetLanguage) {
    return { success: false, error: 'Source and target language are the same' }
  }

  // Check if translation already exists
  const existing = await prisma.translation.findFirst({
    where: { parentContentId: derivative.contentId, targetLanguage },
  })
  if (existing) {
    return { success: true, translationId: existing.id, contentId: existing.contentId }
  }

  // Check cache
  const cacheKey = `${derivativeId}-${targetLanguage}`
  const cached = translationCache.get(cacheKey)
  if (cached) {
    const contentId = `trans-${cuid()}`
    const translation = await prisma.translation.create({
      data: {
        contentId,
        parentContentId: derivative.contentId,
        derivativeId: derivative.id,
        sourceLanguage: derivative.language,
        targetLanguage,
        title: `${derivative.title} (${LANGUAGE_NAMES[targetLanguage] || targetLanguage})`,
        body: cached,
        status: 'ai_draft',
        reviewPass: 1,
        isAiGenerated: true,
        aiModel: 'claude-haiku-4-5-20251001',
      },
    })
    return { success: true, translationId: translation.id, contentId }
  }

  // Call Claude Haiku for translation
  const apiKey = process.env.ANTHROPIC_API_KEY
  const fromName = LANGUAGE_NAMES[derivative.language] || derivative.language
  const toName = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  let translatedBody: string
  let isAiGenerated = false

  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: `You are a translator for a Christian ministry. Translate the following content from ${fromName} to ${toName}.
Maintain the original tone, meaning, and all spiritual/biblical references.
Preserve formatting (headers, bold markers, line breaks, bullet points, numbered lists).
Use appropriate ${toName} theological terminology familiar to local believers.
Return ONLY the translated text, no explanation or notes.
This content is CC0 public domain.`,
          messages: [{ role: 'user', content: derivative.body }],
        }),
      })

      if (!response.ok) {
        console.error(`Translation API error: ${response.status}`)
        translatedBody = derivative.body // Fallback to original
      } else {
        const data = await response.json()
        translatedBody = data.content?.[0]?.text?.trim() || derivative.body
        isAiGenerated = true
      }
    } catch (error) {
      console.error(`Translation to ${toName} failed:`, error)
      translatedBody = derivative.body
    }
  } else {
    console.warn('ANTHROPIC_API_KEY not set — cannot translate')
    translatedBody = derivative.body
  }

  // Cache the result
  translationCache.set(cacheKey, translatedBody)

  // Create translation record
  const contentId = `trans-${cuid()}`
  const translation = await prisma.translation.create({
    data: {
      contentId,
      parentContentId: derivative.contentId,
      derivativeId: derivative.id,
      sourceLanguage: derivative.language,
      targetLanguage,
      title: `${derivative.title} (${toName})`,
      body: translatedBody,
      status: isAiGenerated ? 'ai_draft' : 'failed',
      reviewPass: 1,
      isAiGenerated,
      aiModel: isAiGenerated ? 'claude-haiku-4-5-20251001' : null,
    },
  })

  // Update metrics
  if (isAiGenerated) {
    await updateRepurposingMetrics({ translationsCompleted: 1, language: targetLanguage })
    await incrementLanguageTranslationCount(targetLanguage)
  }

  return { success: true, translationId: translation.id, contentId }
}

/**
 * Translate a derivative into all configured active languages
 */
export async function translateToAllLanguages(
  derivativeId: string
): Promise<{ success: boolean; results: TranslationResult[] }> {
  const languages = await prisma.languageConfig.findMany({
    where: { isActive: true },
  })

  const results: TranslationResult[] = []
  for (const lang of languages) {
    const result = await translateDerivative(derivativeId, lang.code)
    results.push(result)
  }

  return {
    success: results.some(r => r.success),
    results,
  }
}

/**
 * Submit a review for a translation (Pass 2 or 3)
 */
export async function submitTranslationReview(
  translationId: string,
  action: 'approve' | 'reject' | 'edit',
  reviewerNotes?: string,
  editedBody?: string
): Promise<{ success: boolean; error?: string }> {
  const translation = await prisma.translation.findUnique({ where: { id: translationId } })
  if (!translation) return { success: false, error: 'Translation not found' }

  const nextPass = translation.reviewPass + 1
  let newStatus: string

  switch (action) {
    case 'approve':
      newStatus = nextPass >= 3 ? 'approved' : 'reviewed'
      break
    case 'reject':
      newStatus = 'ai_draft' // Reset to AI draft for re-translation
      break
    case 'edit':
      newStatus = 'reviewed'
      break
    default:
      return { success: false, error: 'Invalid action' }
  }

  await prisma.translation.update({
    where: { id: translationId },
    data: {
      status: newStatus,
      reviewPass: action === 'reject' ? 1 : nextPass,
      reviewerNotes: reviewerNotes || translation.reviewerNotes,
      body: editedBody || translation.body,
    },
  })

  return { success: true }
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Get supported language name
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase()
}
