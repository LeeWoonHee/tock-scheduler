import { describe, expect, test } from 'bun:test'
import { getGoogleSignInURL, GoogleSignInError, type SignInRequest } from './google-sign-in'

const authorizeURL = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test-client'
const requestId = '8cfa853d-aac2-4cb4-a829-e91115c45e73'
const reply =
  (response: Response): SignInRequest =>
  async () =>
    response

describe('Google 로그인 시작', () => {
  test('리디렉션을 직접 처리하도록 요청하고 Google 주소를 반환한다', async () => {
    let endpoint: unknown, init: RequestInit | undefined
    const request: SignInRequest = async (url, options) => {
      endpoint = url
      init = options
      return Response.json({ url: authorizeURL, redirect: false })
    }
    expect(await getGoogleSignInURL('/app/today', request)).toBe(authorizeURL)
    expect(endpoint).toBe('/api/auth/sign-in/social')
    expect(init?.credentials).toBe('same-origin')
    expect(JSON.parse(String(init?.body))).toEqual({
      provider: 'google',
      disableRedirect: true,
      callbackURL: '/app/today',
      errorCallbackURL: '/login?error=oauth',
    })
  })
  test('주소 불일치와 문의 코드를 표시하고 서버의 원문 오류는 노출하지 않는다', async () => {
    const response = Response.json(
      { code: 'AUTH_ORIGIN_MISMATCH', message: 'private-server-detail' },
      { status: 403, headers: { 'X-Request-ID': requestId } },
    )
    const error = await getGoogleSignInURL('/app/today', reply(response)).catch((error) => error)
    expect(error).toBeInstanceOf(GoogleSignInError)
    expect(error.code).toBe('AUTH_ORIGIN_MISMATCH')
    expect(error.message).toContain('공식 주소')
    expect(error.message).toContain(requestId)
    expect(error.message).not.toContain('private-server-detail')
  })
  test('DB 준비 실패를 일반 연결 실패와 구분한다', async () => {
    const error = await getGoogleSignInURL(
      '/app/today',
      reply(Response.json({ code: 'AUTH_DATABASE_NOT_READY' }, { status: 503 })),
    ).catch((error) => error)
    expect(error.code).toBe('AUTH_DATABASE_NOT_READY')
    expect(error.message).toContain('데이터베이스가 준비되지 않았습니다')
  })
  test('네트워크 예외는 연결 오류로 처리한다', async () => {
    const request: SignInRequest = async () => {
      throw new TypeError('private-network-detail')
    }
    const error = await getGoogleSignInURL('/app/today', request).catch((error) => error)
    expect(error.code).toBe('AUTH_NETWORK_ERROR')
    expect(error.message).not.toContain('private-network-detail')
  })
  test('HTML 또는 URL 없는 성공 응답을 거절한다', async () => {
    for (const response of [
      new Response('<html>proxy error</html>'),
      Response.json({ redirect: true }),
    ]) {
      const error = await getGoogleSignInURL('/app/today', reply(response)).catch((error) => error)
      expect(error.code).toBe('AUTH_RESPONSE_INVALID')
    }
  })
  test('Google이 아닌 주소와 실행 가능한 URL로 이동하지 않는다', async () => {
    for (const url of [
      'javascript:alert(1)',
      'https://evil.example',
      'https://accounts.google.com.evil.example',
      'https://private@accounts.google.com',
      'http://accounts.google.com',
      'https://accounts.google.com:8443',
    ]) {
      const error = await getGoogleSignInURL('/app/today', reply(Response.json({ url }))).catch(
        (error) => error,
      )
      expect(error.code).toBe('AUTH_RESPONSE_INVALID')
    }
  })
  test('알 수 없는 오류 코드는 원문 대신 일반 오류로 처리한다', async () => {
    const error = await getGoogleSignInURL(
      '/app/today',
      reply(
        Response.json(
          { code: 'private-code', message: 'private-detail' },
          { status: 500, headers: { 'X-Request-ID': 'private-not-an-id' } },
        ),
      ),
    ).catch((error) => error)
    expect(error.code).toBe('AUTH_SERVICE_UNAVAILABLE')
    expect(error.message).not.toContain('private')
  })
})
