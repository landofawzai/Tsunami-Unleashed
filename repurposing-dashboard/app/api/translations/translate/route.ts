// Translation Trigger API
// POST: Trigger translation of derivative(s) to target language(s)

import { NextRequest, NextResponse } from 'next/server'
import { translateDerivative, translateToAllLanguages } from '@/lib/translation-engine'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { derivativeId, derivativeIds, targetLanguage, targetLanguages } = body

    if (!derivativeId && !derivativeIds) {
      return NextResponse.json(
        { error: 'derivativeId or derivativeIds is required' },
        { status: 400 }
      )
    }

    // Single derivative, all languages
    if (derivativeId && !targetLanguage && !targetLanguages) {
      const result = await translateToAllLanguages(derivativeId)
      return NextResponse.json({
        success: result.success,
        results: result.results,
        translated: result.results.filter(r => r.success).length,
      })
    }

    // Single derivative, specific language(s)
    if (derivativeId) {
      const langs = targetLanguages || [targetLanguage]
      const results = []
      for (const lang of langs) {
        const result = await translateDerivative(derivativeId, lang)
        results.push({ language: lang, ...result })
      }
      return NextResponse.json({
        success: results.some(r => r.success),
        results,
        translated: results.filter(r => r.success).length,
      })
    }

    // Multiple derivatives
    if (derivativeIds) {
      const allResults = []
      for (const dId of derivativeIds) {
        if (targetLanguages || targetLanguage) {
          const langs = targetLanguages || [targetLanguage]
          for (const lang of langs) {
            const result = await translateDerivative(dId, lang)
            allResults.push({ derivativeId: dId, language: lang, ...result })
          }
        } else {
          const result = await translateToAllLanguages(dId)
          allResults.push(...result.results.map(r => ({ derivativeId: dId, ...r })))
        }
      }
      return NextResponse.json({
        success: allResults.some(r => r.success),
        results: allResults,
        translated: allResults.filter(r => r.success).length,
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Translation trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger translation' },
      { status: 500 }
    )
  }
}
