import { createRequire } from 'node:module'

const required = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]
const missing = required.filter((key) => !process.env[key]?.trim())
if ((process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32 && !missing.includes('BETTER_AUTH_SECRET'))
  missing.push('BETTER_AUTH_SECRET (32자 이상)')
if (process.env.BETTER_AUTH_URL) {
  try {
    const url = new URL(process.env.BETTER_AUTH_URL)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      missing.push('BETTER_AUTH_URL (배포 사이트의 HTTPS origin)')
  } catch {
    missing.push('BETTER_AUTH_URL (유효한 URL)')
  }
}
try {
  createRequire(import.meta.url).resolve('better-auth')
} catch {
  missing.push('better-auth 패키지: npm install 필요')
}
if (process.env.APP_STORAGE === 'local') missing.push('APP_STORAGE=postgres 설정 필요')
if (missing.length) {
  console.error('운영 실행에 필요한 설정:\n' + missing.map((key) => `- ${key}`).join('\n'))
  process.exitCode = 1
} else console.log('운영 필수 설정 확인 완료. 실제 DB 연결과 OAuth 콜백은 별도로 검증하세요.')
