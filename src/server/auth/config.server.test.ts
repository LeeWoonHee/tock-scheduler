import { describe, expect, test } from 'bun:test'
import { getAuthConfigurationIssues } from './config.server'

const configured: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  APP_STORAGE: 'postgres',
  DATABASE_URL: 'postgresql://example:example@db.example/dayflow',
  BETTER_AUTH_SECRET: 'test-only-secret-that-is-at-least-32-characters',
  BETTER_AUTH_URL: 'https://dayflow.example',
  GOOGLE_CLIENT_ID: 'test-client',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
}

describe('운영 인증 설정', () => {
  test('유효한 운영 설정은 문제를 반환하지 않는다', () => {
    expect(getAuthConfigurationIssues(configured)).toEqual([])
  })
  test('설정이 없을 때 값 대신 누락 필드 이름만 반환한다', () => {
    expect(getAuthConfigurationIssues({ NODE_ENV: 'production' })).toEqual([
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ])
  })
  test('짧은 비밀키와 공백인 클라이언트 ID는 준비된 설정으로 보지 않는다', () => {
    const issues = getAuthConfigurationIssues({
      ...configured,
      BETTER_AUTH_SECRET: 'short',
      GOOGLE_CLIENT_ID: '  ',
    })
    expect(issues).toContain('BETTER_AUTH_SECRET (32자 이상)')
    expect(issues).toContain('GOOGLE_CLIENT_ID')
    expect(issues.join(',')).not.toContain('short')
  })
  test('운영 URL의 HTTP·경로·쿼리·인증 정보와 잘못된 URL을 거절한다', () => {
    for (const url of [
      'http://localhost:3100',
      'https://dayflow.example/login',
      'https://dayflow.example?token=private',
      'https://dayflow.example#fragment',
      'https://user:private@dayflow.example',
      'not-a-url',
    ]) {
      const issues = getAuthConfigurationIssues({ ...configured, BETTER_AUTH_URL: url })
      expect(issues.some((issue) => issue.startsWith('BETTER_AUTH_URL'))).toBe(true)
      expect(issues.join(',')).not.toContain('private')
    }
  })
  test('운영에서 local 저장 설정은 거절한다', () => {
    expect(getAuthConfigurationIssues({ ...configured, APP_STORAGE: 'local' })).toContain(
      'APP_STORAGE (운영에서는 postgres)',
    )
  })
  test('개발 OAuth는 localhost의 HTTP URL을 허용한다', () => {
    expect(
      getAuthConfigurationIssues({
        ...configured,
        NODE_ENV: 'development',
        BETTER_AUTH_URL: 'http://localhost:3100',
      }),
    ).toEqual([])
  })
})
