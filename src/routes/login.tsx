import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { getAuthMode, getSessionFn, localLogin } from '@/server/functions/auth'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; error?: string } => ({
    redirect:
      typeof search.redirect === 'string' &&
      /^\/app(?:\/|$)/.test(search.redirect) &&
      !search.redirect.includes('\\')
        ? search.redirect
        : '/app/today',
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  beforeLoad: async () => {
    if (await getSessionFn()) throw redirect({ to: '/app/today' })
  },
  loader: () => getAuthMode(),
  component: Login,
})
function Login() {
  const mode = Route.useLoaderData(),
    search = Route.useSearch(),
    navigate = useNavigate(),
    client = useQueryClient()
  const [pending, setPending] = useState(false),
    [error, setError] = useState('')
  async function start() {
    setPending(true)
    setError('')
    try {
      await localLogin()
      client.clear()
      await navigate({ href: search.redirect ?? '/app/today' })
    } catch {
      setError('시작하지 못했습니다. 다시 시도해 주세요.')
      setPending(false)
    }
  }
  async function google() {
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: search.redirect,
          errorCallbackURL: '/login?error=oauth',
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error()
      window.location.assign(data.url)
    } catch {
      setError('Google 로그인에 연결하지 못했습니다.')
      setPending(false)
    }
  }
  return (
    <main className="flex min-h-dvh bg-background">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-secondary p-14 lg:flex">
        <a href="/" className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Check size={23} strokeWidth={3} />
          </span>
          dayflow<span className="ml-1 text-primary">.</span>
        </a>
        <div className="max-w-lg">
          <p className="mb-6 text-sm text-muted-foreground">하루의 방향을 정하는 작은 습관</p>
          <h1 className="text-[clamp(2.5rem,4.4vw,5rem)] font-semibold leading-[1.18] tracking-[-0.065em]">
            생각은 가볍게.
            <br />
            하루는 선명하게.
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-7 text-muted-foreground">
            흩어진 할 일을 모으고, 중요한 일에 시간을 내세요.
            <br />
            목록부터 캘린더까지 한곳에서 이어집니다.
          </p>
        </div>
        <div className="flex items-end gap-5 border-t border-border pt-6">
          <span className="text-7xl font-light leading-none tracking-[-0.08em] text-primary">
            01
          </span>
          <p className="pb-1 text-sm text-muted-foreground">
            한 번에 하나씩.
            <br />
            <span className="text-foreground">오늘의 첫 번째 일을 시작하세요.</span>
          </p>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[350px]">
          <div className="mb-12 flex items-center gap-2 text-xl font-semibold lg:hidden">
            <Check className="text-primary" />
            dayflow.
          </div>
          <p className="mb-3 text-sm font-medium text-primary">나만의 작업 공간</p>
          <h2 className="text-3xl font-semibold tracking-tight">좋은 하루의 시작</h2>
          <p className="mb-9 mt-3 text-sm leading-6 text-muted-foreground">
            로그인하고 오늘의 할 일을 정리해 보세요.
          </p>
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            disabled={pending || !mode.googleConfigured}
            onClick={google}
          >
            <span className="text-lg font-bold text-primary" aria-hidden>
              G
            </span>
            Google로 계속하기
          </Button>
          {mode.local && (
            <>
              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                또는
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button className="w-full" size="lg" disabled={pending} onClick={start}>
                {pending ? <Loader2 size={17} className="animate-spin" /> : '로컬에서 시작'}
                <ArrowRight size={16} />
              </Button>
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                로컬 개발 모드입니다. 이 컴퓨터의 파일에 저장되며 Google 계정이나 클라우드와
                연결되지 않습니다.
              </p>
            </>
          )}
          {!mode.local && !mode.googleConfigured && (
            <p className="mt-4 text-sm text-destructive">
              로그인 설정이 필요합니다. 서버의 Google OAuth 환경변수를 확인해 주세요.
            </p>
          )}
          {(error || search.error) && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error || '로그인을 완료하지 못했습니다. 다시 시도해 주세요.'}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
