import {
  HeadContent,
  Scripts,
  Outlet,
  createRootRouteWithContext,
  Link,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import styles from '@/styles.css?url'
import { ThemeProvider } from '@/components/theme-provider'
import { useThemeStore } from '@/hooks/use-theme-store'
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme'

function RootContent() {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Outlet />
        <Toaster theme={resolvedTheme} position="bottom-center" closeButton richColors />
      </MotionConfig>
    </ThemeProvider>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Dayflow — 하루를 정리하는 작업 공간' },
      {
        name: 'description',
        content: 'Inbox, 오늘 할 일, 캘린더를 하나의 작업 공간에서 관리하세요.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootContent,
  shellComponent: ({ children }) => (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <p className="text-6xl font-semibold text-primary">404</p>
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <Link to="/app/today" className="text-primary underline">
        오늘 할 일로 돌아가기
      </Link>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">작업 공간을 불러오지 못했습니다.</h1>
      <p className="text-sm text-muted-foreground">
        연결과 서버 설정을 확인한 뒤 다시 시도해 주세요.
      </p>
      <button onClick={reset} className="rounded-lg bg-primary px-5 py-2 text-primary-foreground">
        다시 시도
      </button>
    </main>
  ),
})
