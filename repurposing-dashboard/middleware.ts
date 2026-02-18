// Middleware — Protects translator portal review/admin API routes
// Only matches specific API paths that require authentication

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'translator_token'

// Routes that require a valid JWT
const PROTECTED_PATTERNS = [
  '/api/translate/auth/register',
  '/api/translate/users',
]

// Pattern for submit-review routes (dynamic segment)
const SUBMIT_REVIEW_PATTERN = /^\/api\/translate\/[^/]+\/submit-review$/

function getJwtSecret(): Uint8Array {
  const secret = process.env.TRANSLATOR_JWT_SECRET
  if (!secret) throw new Error('TRANSLATOR_JWT_SECRET not set')
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected route
  const isProtected =
    PROTECTED_PATTERNS.some((p) => pathname.startsWith(p)) ||
    SUBMIT_REVIEW_PATTERN.test(pathname)

  if (!isProtected) return NextResponse.next()

  // Verify JWT
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login required' },
      { status: 401 }
    )
  }

  try {
    await jwtVerify(token, getJwtSecret())
    return NextResponse.next()
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: ['/api/translate/:path*'],
}
