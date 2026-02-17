// Template Detail API
// GET: Fetch single template
// PATCH: Update template

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.derivativeTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, systemPrompt, userPromptTemplate, maxTokens, outputFormat, isActive } = body

    const template = await prisma.derivativeTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (userPromptTemplate !== undefined) updateData.userPromptTemplate = userPromptTemplate
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens
    if (outputFormat !== undefined) updateData.outputFormat = outputFormat
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.derivativeTemplate.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}
