// Segment Contacts API
// POST: Add contacts to segment
// DELETE: Remove contacts from segment

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      )
    }

    // Resolve segment by ID or name
    const segment = await prisma.segment.findFirst({
      where: {
        OR: [
          { id: params.id },
          { name: params.id },
        ],
      },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    let added = 0
    for (const contactId of contactIds) {
      try {
        await prisma.contactSegment.create({
          data: { contactId, segmentId: segment.id },
        })
        added++
      } catch {
        // Skip duplicates
      }
    }

    // Update count
    const count = await prisma.contactSegment.count({
      where: { segmentId: segment.id },
    })
    await prisma.segment.update({
      where: { id: segment.id },
      data: { contactCount: count },
    })

    return NextResponse.json({
      added,
      totalContacts: count,
    })
  } catch (error) {
    console.error('Add contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to add contacts' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      )
    }

    // Resolve segment by ID or name
    const segment = await prisma.segment.findFirst({
      where: {
        OR: [
          { id: params.id },
          { name: params.id },
        ],
      },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    const result = await prisma.contactSegment.deleteMany({
      where: {
        segmentId: segment.id,
        contactId: { in: contactIds },
      },
    })

    // Update count
    const count = await prisma.contactSegment.count({
      where: { segmentId: segment.id },
    })
    await prisma.segment.update({
      where: { id: segment.id },
      data: { contactCount: count },
    })

    return NextResponse.json({
      removed: result.count,
      totalContacts: count,
    })
  } catch (error) {
    console.error('Remove contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to remove contacts' },
      { status: 500 }
    )
  }
}
