const messages = {
  AUTH_CONFIGURATION_INVALID: '로그인 서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.',
  AUTH_RUNTIME_UNAVAILABLE: '로그인 서비스를 시작하지 못했습니다. 관리자에게 문의해 주세요.',
  AUTH_DATABASE_NOT_READY: '로그인 데이터베이스가 준비되지 않았습니다. 관리자에게 문의해 주세요.',
  AUTH_DATABASE_UNAVAILABLE: '로그인 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  AUTH_ORIGIN_MISMATCH:
    '현재 접속 주소에서 로그인할 수 없습니다. 서비스의 공식 주소로 접속해 주세요.',
  AUTH_REQUEST_REJECTED: '로그인 요청이 거절되었습니다. 새로고침 후 다시 시도해 주세요.',
  AUTH_SERVICE_UNAVAILABLE:
    '로그인 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  AUTH_RESPONSE_INVALID:
    '로그인 서버가 올바른 응답을 보내지 않았습니다. 잠시 후 다시 시도해 주세요.',
  AUTH_NETWORK_ERROR: '로그인 서버에 연결하지 못했습니다. 네트워크 연결을 확인해 주세요.',
} as const

export type AuthFailureCode = keyof typeof messages
export type SignInRequest = (input: string, init: RequestInit) => Promise<Response>

export class GoogleSignInError extends Error {
  constructor(
    readonly code: AuthFailureCode,
    requestId?: unknown,
  ) {
    const reference =
      typeof requestId === 'string' && /^[a-f0-9-]{36}$/i.test(requestId)
        ? ` (문의 코드: ${requestId})`
        : ''
    super(messages[code] + reference)
    this.name = 'GoogleSignInError'
  }
}

function failureCode(data: unknown, status: number): AuthFailureCode {
  const code = data && typeof data === 'object' && 'code' in data ? data.code : undefined
  if (typeof code === 'string' && Object.hasOwn(messages, code)) return code as AuthFailureCode
  if (
    ['INVALID_ORIGIN', 'INVALID_CALLBACK_URL', 'INVALID_ERROR_CALLBACK_URL'].includes(String(code))
  )
    return 'AUTH_ORIGIN_MISMATCH'
  return status === 403 ? 'AUTH_REQUEST_REJECTED' : 'AUTH_SERVICE_UNAVAILABLE'
}

export async function getGoogleSignInURL(
  callbackURL: string,
  request: SignInRequest = fetch,
): Promise<string> {
  let response: Response
  try {
    response = await request('/api/auth/sign-in/social', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        disableRedirect: true,
        callbackURL,
        errorCallbackURL: '/login?error=oauth',
      }),
    })
  } catch {
    throw new GoogleSignInError('AUTH_NETWORK_ERROR')
  }
  const data: unknown = await response.json().catch(() => null)
  const requestId = response.headers.get('x-request-id')
  if (!response.ok) throw new GoogleSignInError(failureCode(data, response.status), requestId)
  if (!data || typeof data !== 'object' || !('url' in data) || typeof data.url !== 'string')
    throw new GoogleSignInError('AUTH_RESPONSE_INVALID', requestId)
  try {
    const url = new URL(data.url)
    if (url.origin === 'https://accounts.google.com' && !url.username && !url.password)
      return url.href
  } catch {
    // An unexpected response must never be used as a navigation target.
  }
  throw new GoogleSignInError('AUTH_RESPONSE_INVALID', requestId)
}
