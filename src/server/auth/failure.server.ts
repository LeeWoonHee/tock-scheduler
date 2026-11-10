import type { AuthFailureCode } from '@/features/auth/google-sign-in'

export class AuthConfigurationError extends Error {
  readonly code = 'AUTH_CONFIGURATION_INVALID'
  constructor() {
    super('Authentication configuration is invalid')
    this.name = 'AuthConfigurationError'
  }
}

export function classifyAuthFailure(error: unknown): AuthFailureCode {
  const seen = new Set<unknown>()
  for (let current = error; current && typeof current === 'object' && !seen.has(current);) {
    seen.add(current)
    const code = 'code' in current ? current.code : undefined
    if (code === 'AUTH_CONFIGURATION_INVALID') return 'AUTH_CONFIGURATION_INVALID'
    if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND')
      return 'AUTH_RUNTIME_UNAVAILABLE'
    if (code === '42P01' || code === '42703') return 'AUTH_DATABASE_NOT_READY'
    if (
      [
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        '28P01',
        '3D000',
        '08006',
        '08001',
      ].includes(String(code))
    )
      return 'AUTH_DATABASE_UNAVAILABLE'
    current = 'cause' in current ? current.cause : undefined
  }
  return 'AUTH_SERVICE_UNAVAILABLE'
}

export function authFailureResponse(code: AuthFailureCode, status: number, requestId: string) {
  return Response.json(
    { error: 'Authentication is temporarily unavailable', code, requestId },
    { status, headers: { 'Cache-Control': 'private, no-store', 'X-Request-ID': requestId } },
  )
}

export function withAuthResponseHeaders(response: Response, requestId: string) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('X-Request-ID', requestId)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
