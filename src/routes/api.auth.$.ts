import { createFileRoute } from '@tanstack/react-router'
import { withAuth, isLocalMode } from '@/server/auth/auth.server'
import {
  authFailureResponse,
  classifyAuthFailure,
  withAuthResponseHeaders,
  authFailureStatus,
  describeAuthFailure,
} from '@/server/auth/failure.server'

async function handle(request: Request) {
  const requestId = crypto.randomUUID()
  const path = new URL(request.url).pathname
  const isSocialSignIn = path === '/api/auth/sign-in/social' && request.method === 'POST'
  if (isLocalMode())
    return Response.json(
      { error: 'Google OAuth is not configured in local mode' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  try {
    // Keep the canonical origin check; never trust arbitrary preview domains.
    if (isSocialSignIn && request.headers.has('origin') && process.env.BETTER_AUTH_URL) {
      const expectedOrigin = new URL(process.env.BETTER_AUTH_URL).origin
      if (request.headers.get('origin') !== expectedOrigin) {
        console.error('[dayflow:auth] Request rejected', {
          requestId,
          path,
          code: 'AUTH_ORIGIN_MISMATCH',
        })
        return authFailureResponse('AUTH_ORIGIN_MISMATCH', 403, requestId)
      }
    }
    const response = await withAuth((auth) => auth.handler(request))
    if (isSocialSignIn && response.status >= 400) {
      const body: unknown = await response
        .clone()
        .json()
        .catch(() => null)
      const providerCode =
        body && typeof body === 'object' && 'code' in body && typeof body.code === 'string'
          ? body.code
          : undefined
      const originFailure = [
        'INVALID_ORIGIN',
        'INVALID_CALLBACK_URL',
        'INVALID_ERROR_CALLBACK_URL',
      ].includes(providerCode ?? '')
      const code = originFailure
        ? 'AUTH_ORIGIN_MISMATCH'
        : response.status < 500
          ? 'AUTH_REQUEST_REJECTED'
          : 'AUTH_SERVICE_UNAVAILABLE'
      console.error('[dayflow:auth] Sign-in failed', {
        requestId,
        path,
        status: response.status,
        code,
      })
      return authFailureResponse(code, response.status, requestId)
    }
    return withAuthResponseHeaders(response, requestId)
  } catch (error) {
    const code = classifyAuthFailure(error)
    console.error('[dayflow:auth] Handler failed', {
      requestId,
      path,
      ...describeAuthFailure(error),
    })
    return authFailureResponse(code, authFailureStatus(error), requestId)
  }
}
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) },
  },
})
