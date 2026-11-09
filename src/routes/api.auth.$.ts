import { createFileRoute } from '@tanstack/react-router'
import { withAuth, isLocalMode } from '@/server/auth/auth.server'

async function handle(request: Request) {
  if (isLocalMode())
    return Response.json(
      { error: 'Google OAuth is not configured in local mode' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  try {
    const response = await withAuth((auth) => auth.handler(request))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return Response.json(
      { error: 'Authentication is temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) },
  },
})
