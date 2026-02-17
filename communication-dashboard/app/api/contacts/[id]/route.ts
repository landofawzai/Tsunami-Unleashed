// Contact Detail API
// GET: Get contact with segments and delivery history

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        segments: {
          include: {
            segment: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        deliveries: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            broadcast: {
              include: {
                campaign: {
                  select: { title: true, type: true },
                },
              },
            },
          },
        },
        enrollments: {
          include: {
            sequence: {
              select: { name: true, status: true, totalSteps: true },
            },
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load contact' },
      { status: 500 }
    )
  }
}
