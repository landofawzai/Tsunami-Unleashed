// Translator Portal — Authentication Utilities
// JWT in httpOnly cookie + bcryptjs password hashing

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'

const COOKIE_NAME = 'translator_token'
const JWT_EXPIRY = '7d'
const BCRYPT_ROUNDS = 10

function getJwtSecret(): Uint8Array {
  const secret = process.env.TRANSLATOR_JWT_SECRET
  if (!secret) throw new Error('TRANSLATOR_JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

// ── Password Hashing ──

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── JWT ──

interface JwtPayload {
  sub: string      // user id
  username: string
  role: string
}

export async function signJWT(payload: JwtPayload): Promise<string> {
  return new SignJWT({ sub: payload.sub, username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret())
}

export async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

// ── Cookie Helpers ──

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ── Request Helpers ──

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value || null
}

export async function getUserFromRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload) return null

  const user = await prisma.translatorUser.findUnique({
    where: { id: payload.sub },
  })

  if (!user || !user.isActive) return null

  return user
}

export async function getPayloadFromRequest(request: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyJWT(token)
}

// ── Portal Setting ──

export async function isPortalOpen(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'translation_portal_open' },
  })
  return setting?.value !== 'false'
}
