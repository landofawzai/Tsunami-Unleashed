// Send to Distribution API
// POST: Push a derivative to the Distribution Dashboard via Pabbly

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendToDistribution } from '@/lib/pabbly-integration'
import { uploadDerivativeWithSidecar } from '@/lib/drive-integration'
import { updateRepurposingMetrics } from '@/lib/metrics-helpers'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const derivative = await prisma.derivative.findUnique({
      where: { id: params.id },
      include: { sourceContent: { select: { contentType: true } } },
    })

    if (!derivative) {
      return NextResponse.json({ error: 'Derivative not found' }, { status: 404 })
    }

    if (derivative.sentToDistribution) {
      return NextResponse.json(
        { error: 'Already sent to distribution', distributedAt: derivative.distributedAt },
        { status: 409 }
      )
    }

    // Upload to Google Drive with sidecar
    await uploadDerivativeWithSidecar({
      contentId: derivative.contentId,
      parentContentId: derivative.parentContentId,
      derivativeType: derivative.derivativeType,
      title: derivative.title,
      body: derivative.body,
      language: derivative.language,
      format: derivative.format,
      isAiGenerated: derivative.isAiGenerated,
    })

    // Fire Pabbly webhook to Distribution
    const pabblyResult = await sendToDistribution({
      contentId: derivative.contentId,
      parentContentId: derivative.parentContentId,
      title: derivative.title,
      contentType: derivative.sourceContent?.contentType || derivative.derivativeType,
      language: derivative.language,
      body: derivative.body,
      derivativeType: derivative.derivativeType,
    })

    // Update derivative status
    await prisma.derivative.update({
      where: { id: params.id },
      data: {
        status: 'sent_to_distribution',
        sentToDistribution: true,
        distributedAt: new Date(),
      },
    })

    // Update metrics
    await updateRepurposingMetrics({ sentToDistribution: 1 })

    return NextResponse.json({
      success: true,
      message: `Derivative "${derivative.title}" sent to Distribution Dashboard`,
      pabblyResult,
    })
  } catch (error) {
    console.error('Send to distribution error:', error)
    return NextResponse.json(
      { error: 'Failed to send to distribution' },
      { status: 500 }
    )
  }
}
