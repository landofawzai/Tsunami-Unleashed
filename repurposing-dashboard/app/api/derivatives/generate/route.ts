// Derivative Generation API
// POST: Generate derivatives for a source content

import { NextRequest, NextResponse } from 'next/server'
import { generateBatchDerivatives } from '@/lib/derivative-generator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceContentId, derivativeTypes } = body

    if (!sourceContentId) {
      return NextResponse.json(
        { error: 'sourceContentId is required' },
        { status: 400 }
      )
    }

    const result = await generateBatchDerivatives(sourceContentId, derivativeTypes)

    return NextResponse.json({
      success: result.success,
      results: result.results,
      generated: result.results.filter(r => r.success).length,
      failed: result.results.filter(r => !r.success).length,
    }, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('Derivative generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate derivatives' },
      { status: 500 }
    )
  }
}
