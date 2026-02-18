// POST /api/translate/auth/logout — Clear auth cookie

import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/translator-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearAuthCookie(response)
  return response
}
