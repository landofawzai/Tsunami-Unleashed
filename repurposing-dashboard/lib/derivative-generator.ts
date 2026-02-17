// Derivative Generator — Claude Haiku Text Generation
// Generates derivatives from source content using template prompts

import { prisma } from './prisma'
import { updateRepurposingMetrics } from './metrics-helpers'

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4)
}

interface GenerationResult {
  success: boolean
  derivativeId?: string
  contentId?: string
  error?: string
}

/**
 * Generate a single derivative from source content using a template
 */
export async function generateDerivative(
  sourceContentId: string,
  derivativeType: string,
  templateId?: string
): Promise<GenerationResult> {
  const source = await prisma.sourceContent.findUnique({ where: { id: sourceContentId } })
  if (!source) return { success: false, error: 'Source content not found' }

  // Get template for this derivative type
  const template = templateId
    ? await prisma.derivativeTemplate.findUnique({ where: { id: templateId } })
    : await prisma.derivativeTemplate.findFirst({
        where: { derivativeType, isActive: true },
      })

  if (!template) {
    return { success: false, error: `No active template for derivative type: ${derivativeType}` }
  }

  // Get source text (transcription or article body from metadata)
  const sourceText = source.transcription || extractBodyFromMetadata(source.metadata)
  if (!sourceText) {
    return { success: false, error: 'No text available for generation (no transcription or body)' }
  }

  // Build the prompt from template
  const userPrompt = template.userPromptTemplate
    .replace('{title}', source.title)
    .replace('{contentType}', source.contentType)
    .replace('{transcription}', sourceText)
    .replace('{duration}', String(source.durationSeconds || 0))

  // Call Claude Haiku
  const apiKey = process.env.ANTHROPIC_API_KEY
  let generatedBody: string
  let isAiGenerated = false
  const aiModel = 'claude-haiku-4-5-20251001'

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
          model: aiModel,
          max_tokens: template.maxTokens,
          system: template.systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        console.error(`Claude API error: ${response.status}`)
        // Fallback: use truncated source text
        generatedBody = `[AI generation failed — using source excerpt]\n\n${sourceText.substring(0, 500)}...`
      } else {
        const data = await response.json()
        generatedBody = data.content?.[0]?.text?.trim() || sourceText.substring(0, 500)
        isAiGenerated = true
      }
    } catch (error) {
      console.error('Derivative generation failed:', error)
      generatedBody = `[AI generation failed]\n\n${sourceText.substring(0, 500)}...`
    }
  } else {
    console.warn('ANTHROPIC_API_KEY not set — using source text as fallback')
    generatedBody = sourceText.substring(0, 1000)
  }

  // Create derivative record
  const contentId = `deriv-${derivativeType}-${cuid()}`
  const wordCount = generatedBody.split(/\s+/).filter((w: string) => w.length > 0).length

  const derivative = await prisma.derivative.create({
    data: {
      contentId,
      parentContentId: source.contentId,
      sourceContentId: source.id,
      derivativeType,
      title: `${source.title} — ${formatDerivativeType(derivativeType)}`,
      body: generatedBody,
      language: source.language,
      format: template.outputFormat,
      wordCount,
      isAiGenerated,
      aiModel: isAiGenerated ? aiModel : null,
      templateId: template.id,
      status: 'draft',
    },
  })

  // Increment template usage count
  await prisma.derivativeTemplate.update({
    where: { id: template.id },
    data: { usageCount: { increment: 1 } },
  })

  // Update metrics
  await updateRepurposingMetrics({
    derivativesGenerated: 1,
    derivativeType,
    aiTokensUsed: isAiGenerated ? template.maxTokens : 0,
  })

  return { success: true, derivativeId: derivative.id, contentId }
}

/**
 * Generate all derivative types for a source content
 */
export async function generateBatchDerivatives(
  sourceContentId: string,
  derivativeTypes?: string[]
): Promise<{ success: boolean; results: GenerationResult[]; error?: string }> {
  const types = derivativeTypes || [
    'blog_post', 'social_quote', 'thread_summary', 'study_guide',
    'newsletter_excerpt', 'audio_transcription', 'video_clip_meta', 'quote_graphic',
  ]

  const results: GenerationResult[] = []

  for (const type of types) {
    const result = await generateDerivative(sourceContentId, type)
    results.push(result)
  }

  const successCount = results.filter(r => r.success).length
  return {
    success: successCount > 0,
    results,
    error: successCount === 0 ? 'All derivative generations failed' : undefined,
  }
}

function extractBodyFromMetadata(metadata: string | null): string | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata)
    return parsed.body || null
  } catch {
    return null
  }
}

function formatDerivativeType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
