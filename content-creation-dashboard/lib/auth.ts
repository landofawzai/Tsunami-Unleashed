// API Authentication Middleware
// Validates x-api-key header for webhook endpoints

import { NextRequest, NextResponse } from 'next/server'

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.API_KEY

  if (!validApiKey) {
    console.error('API_KEY environment variable is not set')
    return false
  }

  return apiKey === validApiKey
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Invalid or missing x-api-key header' },
    { status: 401 }
  )
}
