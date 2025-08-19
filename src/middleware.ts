import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (best-effort; per-instance)
// Protects API POST endpoints against burst spam
// For production-grade, move to durable storage (e.g., Upstash, Redis)

type Counter = { count: number; resetAt: number }
const windowMs = 60_000 // 1 minute
const maxRequests = 30 // per window per IP

const buckets: Map<string, Counter> = (global as any).__rateBuckets || new Map()
;(global as any).__rateBuckets = buckets

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0]?.trim() || req.ip || 'unknown'
  // Scope by path group to avoid cross-throttling unrelated endpoints
  const path = req.nextUrl.pathname.split('/').slice(0, 4).join('/')
  return `${ip}:${path}`
}

export function middleware(req: NextRequest) {
  // Only throttle API writes
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()
  // Never throttle NextAuth routes
  if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return NextResponse.next()
  }

  const key = getClientKey(req)
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return NextResponse.next()
  }

  entry.count += 1
  if (entry.count > maxRequests) {
    const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000))
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}


