// GET /api/translate/[id] — Get single translation for portal view
// Includes derivative body for side-by-side comparison

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const translation = await prisma.translation.findUnique({
      where: { id: params.id },
      include: {
        derivative: {
          select: {
            id: true,
            title: true,
            body: true,
            derivativeType: true,
            language: true,
          },
        },
      },
    })

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(translation)
  } catch (error: unknown) {
    console.error('Portal translation detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    )
  }
}
