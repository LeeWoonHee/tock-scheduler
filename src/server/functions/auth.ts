import { createServerFn } from '@tanstack/react-start'
import {
  getSession,
  isLocalMode,
  localSignIn,
  localSignOut,
  privateResponse,
} from '../auth/auth.server'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(() => getSession())
export const getAuthMode = createServerFn({ method: 'GET' }).handler(() => {
  privateResponse()
  return {
    local: isLocalMode(),
    googleConfigured:
      !isLocalMode() &&
      !!process.env.GOOGLE_CLIENT_ID &&
      !!process.env.GOOGLE_CLIENT_SECRET &&
      !!process.env.BETTER_AUTH_SECRET &&
      !!process.env.DATABASE_URL,
  }
})
export const localLogin = createServerFn({ method: 'POST' }).handler(() => {
  privateResponse()
  localSignIn()
  return { ok: true }
})
export const localLogout = createServerFn({ method: 'POST' }).handler(() => {
  privateResponse()
  localSignOut()
  return { ok: true }
})
