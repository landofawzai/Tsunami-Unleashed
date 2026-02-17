// File Detail API
// DELETE: Remove file reference

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.contentFile.findUnique({ where: { id: params.id } })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await prisma.contentFile.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'File reference removed' })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
