import { describe, expect, test } from 'bun:test'
import {
  AuthConfigurationError,
  authFailureResponse,
  classifyAuthFailure,
  withAuthResponseHeaders,
  authFailureStatus,
  describeAuthFailure,
} from './failure.server'

describe('인증 API 오류 분류', () => {
  test('42P01에 table 필드가 없어도 알려진 테이블 이름만 추출한다', () => {
    const error = Object.assign(
      new Error('relation "public.auth_verification" does not exist; private-secret'),
      { code: '42P01' },
    )
    const diagnostic = describeAuthFailure({ cause: error })
    expect(diagnostic.tables).toEqual(['auth_verification'])
    expect(JSON.stringify(diagnostic)).not.toContain('private')
    const alias = Object.assign(new Error('missing FROM-clause entry for table "verification"'), {
      code: '42P01',
    })
    expect(describeAuthFailure(alias).tables).toEqual(['verification'])
  })
  test('42P01 원문에 임의 테이블 이름이나 다른 코드가 있으면 출력하지 않는다', () => {
    const unknown = Object.assign(new Error('relation "private_customer_data" does not exist'), {
      code: '42P01',
    })
    expect(describeAuthFailure(unknown).tables).toEqual([])
    const other = Object.assign(new Error('relation "auth_user"'), { code: '23505' })
    expect(describeAuthFailure(other).tables).toEqual([])
  })
  test('Neon의 ErrorEvent.error 안에 들어간 DNS 오류도 구분한다', () => {
    const error = new Error('private-query', {
      cause: { error: Object.assign(new Error('private-host'), { code: 'ENOTFOUND' }) },
    })
    expect(classifyAuthFailure(error)).toBe('AUTH_DATABASE_UNAVAILABLE')
    expect(describeAuthFailure(error).driverCodes).toEqual(['ENOTFOUND'])
    expect(JSON.stringify(describeAuthFailure(error))).not.toContain('private')
  })
  test('여러 원인과 순환 error 속성에서도 내부 오류를 한 번씩 처리한다', () => {
    const cyclic: { error?: unknown } = {}
    cyclic.error = cyclic
    const error = new AggregateError([cyclic, { code: '42P01' }], 'private-message')
    expect(classifyAuthFailure(error)).toBe('AUTH_DATABASE_NOT_READY')
    expect(describeAuthFailure(error).driverCodes).toEqual(['42P01'])
    expect(JSON.stringify(describeAuthFailure(error))).not.toContain('private')
  })
  test('Better Auth가 던진 4xx 상태를 503으로 바꾸지 않는다', () => {
    for (const [status, expected] of [
      ['UNAUTHORIZED', 401],
      ['FORBIDDEN', 403],
      ['TOO_MANY_REQUESTS', 429],
    ] as const) {
      const error = { status }
      expect(authFailureStatus(error)).toBe(expected)
      expect(classifyAuthFailure(error)).toBe('AUTH_REQUEST_REJECTED')
    }
    expect(authFailureStatus({ statusCode: 400 })).toBe(400)
  })
  test('일반 500 예외 안에 들어 있는 SQLSTATE가 있으면 DB 오류로 분류한다', () => {
    const error = {
      status: 'INTERNAL_SERVER_ERROR',
      cause: { code: '42P01', table: 'auth_verification' },
    }
    expect(authFailureStatus(error)).toBe(500)
    expect(classifyAuthFailure(error)).toBe('AUTH_DATABASE_NOT_READY')
  })
  test('내부 오류 진단에는 원문·SQL·파라미터·비밀 값이 들어가지 않는다', () => {
    const error = Object.assign(new Error('private-secret postgres://user:password@example/db'), {
      query: 'insert private-query',
      params: ['private-cookie'],
      cause: Object.assign(new Error('private-driver-message'), {
        code: '42P01',
        table: 'auth_verification',
      }),
    })
    const diagnostic = describeAuthFailure(error)
    expect(diagnostic.driverCodes).toEqual(['42P01'])
    expect(diagnostic.tables).toEqual(['auth_verification'])
    expect(diagnostic.errorNames).toEqual(['Error'])
    expect(JSON.stringify(diagnostic)).not.toContain('private')
    expect(JSON.stringify(diagnostic)).not.toContain('password')
  })
  test('알 수 없는 상태값과 순환 원인은 안전한 기본값으로 처리한다', () => {
    const error: { status: unknown; cause?: unknown } = { status: '__proto__' }
    error.cause = error
    expect(authFailureStatus(error)).toBe(503)
    expect(describeAuthFailure(error).code).toBe('AUTH_SERVICE_UNAVAILABLE')
    expect(classifyAuthFailure({ code: 'state_generation_error' })).toBe(
      'AUTH_DATABASE_UNAVAILABLE',
    )
  })
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
