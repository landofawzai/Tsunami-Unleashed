// Sequence Enroll API
// POST: Manually enroll contact(s) in a sequence

import { NextRequest, NextResponse } from 'next/server'
import { enrollContact } from '@/lib/sequence-engine'

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

    const results = []
    for (const contactId of contactIds) {
      const result = await enrollContact(params.id, contactId)
      results.push({ contactId, ...result })
    }

    const enrolled = results.filter((r) => r.success).length
    return NextResponse.json({
      enrolled,
      total: contactIds.length,
      results,
    })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll contacts' },
      { status: 500 }
    )
  }
}
