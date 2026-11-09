import { createServerFn } from '@tanstack/react-start'
import { getAuthConfigurationIssues } from '../auth/config.server'
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
    googleConfigured: !isLocalMode() && getAuthConfigurationIssues().length === 0,
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
