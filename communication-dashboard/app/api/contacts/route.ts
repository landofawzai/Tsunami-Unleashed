// Contacts API
// GET: List contacts with filters
// POST: Create a new contact

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const region = searchParams.get('region')
    const language = searchParams.get('language')
    const segment = searchParams.get('segment')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { country: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (region) where.region = region
    if (language) where.language = language
    if (active !== null && active !== '') where.isActive = active === 'true'

    if (segment) {
      where.segments = {
        some: {
          segment: { name: segment },
        },
      }
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: 'asc' },
        include: {
          segments: {
            include: {
              segment: {
                select: { name: true, color: true },
              },
            },
          },
          _count: {
            select: { deliveries: true },
          },
        },
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Contact list error:', error)
    return NextResponse.json(
      { error: 'Failed to load contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, email, phone, whatsapp, telegram, signal,
      region, city, country, language, timezone, notes,
      segmentNames,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        telegram: telegram || null,
        signal: signal || null,
        region: region || null,
        city: city || null,
        country: country || null,
        language: language || 'en',
        timezone: timezone || null,
        notes: notes || null,
      },
    })

    // Add to segments if specified
    if (segmentNames && Array.isArray(segmentNames) && segmentNames.length > 0) {
      const segments = await prisma.segment.findMany({
        where: { name: { in: segmentNames } },
      })

      for (const seg of segments) {
        await prisma.contactSegment.create({
          data: { contactId: contact.id, segmentId: seg.id },
        })
        await prisma.segment.update({
          where: { id: seg.id },
          data: { contactCount: { increment: 1 } },
        })
      }
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Contact create error:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
