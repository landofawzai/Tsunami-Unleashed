// Templates API
// GET: List derivative templates
// POST: Create new template

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const derivativeType = searchParams.get('derivativeType')
    const activeOnly = searchParams.get('activeOnly')

    const where: any = {}
    if (derivativeType) where.derivativeType = derivativeType
    if (activeOnly === 'true') where.isActive = true

    const templates = await prisma.derivativeTemplate.findMany({
      where,
      orderBy: [{ derivativeType: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      templates,
      total: templates.length,
    })
  } catch (error) {
    console.error('Templates list error:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, derivativeType, description, systemPrompt, userPromptTemplate, maxTokens, outputFormat } = body

    if (!name || !derivativeType || !systemPrompt || !userPromptTemplate) {
      return NextResponse.json(
        { error: 'name, derivativeType, systemPrompt, and userPromptTemplate are required' },
        { status: 400 }
      )
    }

    const template = await prisma.derivativeTemplate.create({
      data: {
        name,
        derivativeType,
        description: description || null,
        systemPrompt,
        userPromptTemplate,
        maxTokens: maxTokens || 1024,
        outputFormat: outputFormat || 'text',
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
