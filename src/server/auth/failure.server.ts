import type { AuthFailureCode } from '@/features/auth/google-sign-in'

export class AuthConfigurationError extends Error {
  readonly code = 'AUTH_CONFIGURATION_INVALID'
  constructor() {
    super('Authentication configuration is invalid')
    this.name = 'AuthConfigurationError'
  }
}

function errorChain(error: unknown): Record<string, unknown>[] {
  const seen = new Set<unknown>()
  const chain: Record<string, unknown>[] = []
  const pending: unknown[] = [error]
  for (let index = 0; index < pending.length && chain.length < 64; index++) {
    const current = pending[index]
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)
    chain.push(current as Record<string, unknown>)
    if ('cause' in current) pending.push(current.cause)
    // Neon/WebSocket can wrap the original network error in ErrorEvent.error.
    if ('error' in current) pending.push(current.error)
    if ('errors' in current && Array.isArray(current.errors))
      pending.push(...current.errors.slice(0, 16))
  }
  return chain
}

export function classifyAuthFailure(error: unknown): AuthFailureCode {
  for (const current of errorChain(error)) {
    const code = current.code
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
        'state_generation_error',
      ].includes(String(code))
    )
      return 'AUTH_DATABASE_UNAVAILABLE'
  }
  if (authFailureStatus(error) < 500) return 'AUTH_REQUEST_REJECTED'
  return 'AUTH_SERVICE_UNAVAILABLE'
}

export function authFailureStatus(error: unknown): number {
  const statusNames: Record<string, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  }
  for (const current of errorChain(error)) {
    for (const value of [current.statusCode, current.status]) {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599)
        return value
      if (typeof value === 'string' && Object.hasOwn(statusNames, value)) return statusNames[value]!
    }
  }
  return 503
}

export function describeAuthFailure(error: unknown) {
  const chain = errorChain(error)
  // Never serialize Error.message, SQL queries, parameters, cookies, or env values.
  const driverCodes = chain
    .map((item) => item.code)
    .filter(
      (code): code is string =>
        typeof code === 'string' &&
        (/^[0-9A-Z]{5}$/.test(code) ||
          [
            'MODULE_NOT_FOUND',
            'ERR_MODULE_NOT_FOUND',
            'ENOTFOUND',
            'ETIMEDOUT',
            'ECONNRESET',
            'ECONNREFUSED',
            'state_generation_error',
          ].includes(code)),
    )
  const errorNames = chain
    .map((item) => item.name)
    .filter(
      (name): name is string =>
        typeof name === 'string' &&
        (name === 'Error' || /^[A-Z][a-zA-Z0-9]{0,60}Error$/.test(name)),
    )
  const knownTables = new Set([
    'auth_user',
    'auth_session',
    'auth_account',
    'auth_verification',
    'workspaces',
    'workspace_members',
    'lists',
    'sections',
    'tasks',
    'task_schedules',
    'tags',
    'task_tags',
    'mutation_receipts',
    'user',
    'session',
    'account',
    'verification',
  ])
  const tables = chain
    .map((item) => item.table)
    .filter((table): table is string => typeof table === 'string' && knownTables.has(table))
  for (const item of chain) {
    if (item.code !== '42P01' || typeof item.message !== 'string') continue
    // PostgreSQL may omit .table for undefined relations. Extract only an
    // allowlisted identifier, never the message, SQL, or parameters themselves.
    const relation = item.message
      .match(/\b(?:relation|table)\s+"([^"]+)"/i)?.[1]
      ?.split('.')
      .at(-1)
    if (relation && knownTables.has(relation)) tables.push(relation)
  }
  return {
    code: classifyAuthFailure(error),
    driverCodes: [...new Set(driverCodes)],
    errorNames: [...new Set(errorNames)],
    tables: [...new Set(tables)],
  }
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
