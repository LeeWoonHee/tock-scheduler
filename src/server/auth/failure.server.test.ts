import { describe, expect, test } from 'bun:test'
import {
  AuthConfigurationError,
  authFailureResponse,
  classifyAuthFailure,
  withAuthResponseHeaders,
} from './failure.server'

describe('인증 API 오류 분류', () => {
  test('변경 불가능한 리디렉션 응답도 Location을 유지한다', () => {
    const response = withAuthResponseHeaders(
      Response.redirect('https://dayflow.example/app/today', 302),
      'reference',
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://dayflow.example/app/today')
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  test('여러 인증 쿠키와 응답 본문을 그대로 전달한다', async () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'session=first; HttpOnly; Secure')
    headers.append('Set-Cookie', 'state=second; HttpOnly; Secure')
    const response = withAuthResponseHeaders(new Response('auth body', { headers }), 'reference')
    expect(response.headers.getSetCookie()).toEqual(headers.getSetCookie())
    expect(await response.text()).toBe('auth body')
  })
  test('설정·패키지·DB 스키마·연결 오류를 분류한다', () => {
    expect(classifyAuthFailure(new AuthConfigurationError())).toBe('AUTH_CONFIGURATION_INVALID')
    expect(classifyAuthFailure({ code: 'ERR_MODULE_NOT_FOUND' })).toBe('AUTH_RUNTIME_UNAVAILABLE')
    expect(classifyAuthFailure({ cause: { code: '42P01' } })).toBe('AUTH_DATABASE_NOT_READY')
    expect(classifyAuthFailure({ cause: { cause: { code: '42703' } } })).toBe(
      'AUTH_DATABASE_NOT_READY',
    )
    expect(classifyAuthFailure({ cause: { code: 'ENOTFOUND' } })).toBe('AUTH_DATABASE_UNAVAILABLE')
    expect(classifyAuthFailure({ code: '28P01' })).toBe('AUTH_DATABASE_UNAVAILABLE')
  })
  test('알 수 없는 오류와 순환 cause도 안전하게 처리한다', () => {
    const cyclic: { cause?: unknown } = {}
    cyclic.cause = cyclic
    for (const error of [cyclic, null, undefined, new Error('private-message')])
      expect(classifyAuthFailure(error)).toBe('AUTH_SERVICE_UNAVAILABLE')
  })
  test('공개 응답은 오류 코드·문의 코드와 캐시 금지만 제공한다', async () => {
    const response = authFailureResponse('AUTH_DATABASE_NOT_READY', 503, 'request-reference')
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-request-id')).toBe('request-reference')
    expect(await response.json()).toEqual({
      error: 'Authentication is temporarily unavailable',
      code: 'AUTH_DATABASE_NOT_READY',
      requestId: 'request-reference',
    })
  })
})
