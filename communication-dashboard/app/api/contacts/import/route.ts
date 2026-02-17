// Contact Import API
// POST: Bulk import contacts from JSON array

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { contacts, defaultSegments } = body

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json(
        { error: 'contacts array is required' },
        { status: 400 }
      )
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    // Look up segments for assignment
    const segments = defaultSegments
      ? await prisma.segment.findMany({
          where: { name: { in: defaultSegments } },
        })
      : []

    for (const c of contacts) {
      try {
        if (!c.name) {
          skipped++
          errors.push(`Skipped entry without name`)
          continue
        }

        // Skip if email already exists
        if (c.email) {
          const existing = await prisma.contact.findUnique({
            where: { email: c.email },
          })
          if (existing) {
            skipped++
            continue
          }
        }

        const contact = await prisma.contact.create({
          data: {
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            whatsapp: c.whatsapp || null,
            telegram: c.telegram || null,
            signal: c.signal || null,
            region: c.region || null,
            city: c.city || null,
            country: c.country || null,
            language: c.language || 'en',
            timezone: c.timezone || null,
            notes: c.notes || null,
          },
        })

        // Assign to default segments
        for (const seg of segments) {
          await prisma.contactSegment.create({
            data: { contactId: contact.id, segmentId: seg.id },
          })
          await prisma.segment.update({
            where: { id: seg.id },
            data: { contactCount: { increment: 1 } },
          })
        }

        created++
      } catch (err) {
        skipped++
        errors.push(`Failed to import "${c.name}": ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: contacts.length,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    console.error('Contact import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}
