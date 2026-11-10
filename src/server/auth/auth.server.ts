import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createRequire } from 'node:module'
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeaders,
  setResponseHeader,
} from '@tanstack/react-start/server'
import type { SessionDTO } from '@/features/tasks/types'
import { DomainError } from '../services/errors'
import { withDatabase, type Database } from '@/db/client.server'
import * as schema from '@/db/schema'
import { getAuthConfigurationIssues } from './config.server'
import { AuthConfigurationError } from './failure.server'

export function isLocalMode() {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.APP_STORAGE ?? (process.env.DATABASE_URL ? 'postgres' : 'local')) === 'local'
  )
}
const require = createRequire(import.meta.url)
const localKey = randomBytes(32)
const localToken = () =>
  `local-user.${createHmac('sha256', localKey).update('local-user').digest('hex')}`
export function privateResponse() {
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('Vary', 'Cookie, Authorization')
}
type AuthInstance = { handler: (request: Request) => Promise<Response> }
// Loaded only on the server. Local development does not import OAuth dependencies.
export async function withAuth<T>(run: (auth: AuthInstance) => Promise<T>) {
  const issues = getAuthConfigurationIssues()
  if (issues.length) {
    // Log field names only: configuration values can contain credentials.
    console.error('[dayflow:auth] Invalid configuration', { fields: issues })
    throw new AuthConfigurationError()
  }
  const {
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: baseURL,
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
  } = process.env
  try {
    return await withDatabase(async (db: Database) => {
      const { betterAuth } = await import(/* @vite-ignore */ require.resolve('better-auth'))
      const { drizzleAdapter } = await import(
        /* @vite-ignore */ require.resolve('better-auth/adapters/drizzle')
      )
      // Sign-in and callbacks use the HTTP handler, which owns its Set-Cookie headers.
      const auth = betterAuth({
        database: drizzleAdapter(db, { provider: 'pg', schema }),
        secret,
        baseURL,
        trustedOrigins: [new URL(baseURL!).origin],
        socialProviders: { google: { clientId, clientSecret } },
        advanced: { useSecureCookies: process.env.NODE_ENV === 'production' },
      }) as AuthInstance
      return run(auth)
    })
  } catch (error) {
    console.error('[dayflow:auth] Authentication request failed', error)
    throw error
  }
}
export async function getSession(): Promise<SessionDTO | null> {
  privateResponse()
  if (isLocalMode()) {
    const cookie = getCookie('dayflow.local'),
      expected = localToken()
    if (
      !cookie ||
      cookie.length !== expected.length ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(expected))
    )
      return null
    return { user: { id: 'local-user', name: '나', email: '' }, mode: 'local' }
  }
  // No cookie means no authenticated user. Do not initialize OAuth or the DB
  // just to render the public login page. Cookie presence never grants access.
  if (!getCookie('better-auth.session_token') && !getCookie('__Secure-better-auth.session_token'))
    return null
  const response = await withAuth((auth) =>
    auth.handler(
      new Request(new URL('/api/auth/get-session', process.env.BETTER_AUTH_URL), {
        headers: getRequestHeaders(),
      }),
    ),
  )
  if (!response.ok) {
    console.error('[dayflow:auth] Session validation failed', { status: response.status })
    throw new Error('Session validation failed')
  }
  const cookies = response.headers.getSetCookie()
  if (cookies.length) setResponseHeader('Set-Cookie', cookies)
  const session = (await response.json()) as {
    user: { id: string; name: string; email: string }
  } | null
  return session ? { user: session.user, mode: 'postgres' } : null
}
export async function requireActor() {
  const session = await getSession()
  if (!session) throw new DomainError('UNAUTHENTICATED', '로그인이 필요합니다.')
  return { id: session.user.id, name: session.user.name }
}
export function localSignIn() {
  if (!isLocalMode())
    throw new DomainError('UNAUTHENTICATED', '로컬 로그인은 개발 환경에서만 사용할 수 있습니다.')
  setCookie('dayflow.local', localToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 604800,
  })
}
export function localSignOut() {
  deleteCookie('dayflow.local', { path: '/' })
}
