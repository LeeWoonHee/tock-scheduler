const required = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const

export function getAuthConfigurationIssues(env: NodeJS.ProcessEnv = process.env) {
  const issues: string[] = required.filter((key) => !env[key]?.trim())
  if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length < 32)
    issues.push('BETTER_AUTH_SECRET (32자 이상)')
  if (env.BETTER_AUTH_URL) {
    try {
      const url = new URL(env.BETTER_AUTH_URL)
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        (env.NODE_ENV === 'production' && url.protocol !== 'https:') ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      )
        issues.push('BETTER_AUTH_URL (배포 사이트의 HTTPS origin)')
    } catch {
      issues.push('BETTER_AUTH_URL (유효한 URL)')
    }
  }
  if (env.NODE_ENV === 'production' && env.APP_STORAGE === 'local')
    issues.push('APP_STORAGE (운영에서는 postgres)')
  return issues
}
