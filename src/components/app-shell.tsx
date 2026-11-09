import { useState } from 'react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
  useRouteContext,
  useSearch,
} from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Hash,
  Inbox,
  LayoutList,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/hooks/use-ui-store'
import { workspaceOptions, unwrap } from '@/features/tasks/queries'
import { selectTasks } from '@/features/tasks/selectors'
import { TaskDetailSlot } from '@/features/tasks/task-detail'
import { createList, createTag, updateTimeZone } from '@/server/functions/tasks'
import { localLogout } from '@/server/functions/auth'
import { cn } from '@/lib/utils'
import { useCurrentTime } from '@/hooks/use-current-time'
import { ThemeSelector } from '@/components/theme-selector'

export function AppShell() {
  const { data: state, error, refetch } = useQuery(workspaceOptions),
    { session } = useRouteContext({ from: '/_app' }),
    search = useSearch({ from: '/_app/app' })
  const pathname = useRouterState({ select: (state) => state.location.pathname }),
    navigate = useNavigate(),
    client = useQueryClient()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [dialog, setDialog] = useState<'list' | 'tag' | 'settings' | null>(null),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false)
  const [zone, setZone] = useState('Asia/Seoul')
  const now = useCurrentTime()
  if (!state) return null
  const title = pathname.includes('/lists/')
    ? state.lists.find((list) => pathname.endsWith(list.id))?.name
    : pathname.endsWith('today')
      ? '오늘'
      : pathname.endsWith('inbox')
        ? 'Inbox'
        : pathname.endsWith('calendar')
          ? '캘린더'
          : pathname.endsWith('trash')
            ? '휴지통'
            : '다가오는 일정'
  const menus = [
    {
      to: '/app/inbox' as const,
      name: 'Inbox',
      icon: Inbox,
      count: selectTasks(state, 'inbox', undefined, now).filter((task) => task.status === 'open')
        .length,
    },
    {
      to: '/app/today' as const,
      name: '오늘',
      icon: Sun,
      count: selectTasks(state, 'today', undefined, now).filter((task) => task.status === 'open')
        .length,
    },
    {
      to: '/app/upcoming' as const,
      name: '다가오는 일정',
      icon: CalendarRange,
      count: selectTasks(state, 'upcoming', undefined, now).length,
    },
    { to: '/app/calendar' as const, name: '캘린더', icon: CalendarDays, count: undefined },
  ]
  const setSearch = (patch: Partial<typeof search>) => {
    void navigate({ to: '.', search: (previous) => ({ ...previous, ...patch }), replace: true })
  }
  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const data = { name, requestId: crypto.randomUUID() }
      const item =
        dialog === 'list' ? unwrap(await createList({ data })) : unwrap(await createTag({ data }))
      await client.invalidateQueries(workspaceOptions)
      if (dialog === 'list')
        await navigate({ to: '/app/lists/$listId', params: { listId: item.id } })
      setDialog(null)
      setName('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function saveZone() {
    setBusy(true)
    try {
      unwrap(await updateTimeZone({ data: { timeZone: zone, requestId: crypto.randomUUID() } }))
      await client.invalidateQueries(workspaceOptions)
      setDialog(null)
      toast.success('시간대를 변경했어요.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function logout() {
    setBusy(true)
    try {
      if (session.mode === 'local') await localLogout()
      else {
        const response = await fetch('/api/auth/sign-out', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        })
        if (!response.ok) throw new Error('로그아웃하지 못했습니다.')
      }
      client.clear()
      await navigate({ to: '/login' })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const sidebar = (
    <div className="flex h-full flex-col bg-secondary px-4 py-6">
      <Link
        to="/app/today"
        onClick={() => setSidebarOpen(false)}
        className="mb-9 flex items-center gap-2.5 px-3 text-[21px] font-semibold tracking-[-0.045em]"
      >
        <span className="flex size-[29px] items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
          <Check size={19} strokeWidth={3} />
        </span>
        dayflow<span className="-ml-2 text-primary">.</span>
      </Link>
      <div className="mb-5 flex items-center justify-between px-3">
        <span className="text-[11px] font-medium text-muted-foreground">나의 작업 공간</span>
        <ChevronDown size={13} className="text-muted-foreground" aria-hidden />
      </div>
      <nav aria-label="기본 탐색" className="flex flex-col gap-1">
        {menus.map(({ to, name, icon: Icon, count }) => (
          <Link
            key={to}
            to={to}
            search={{}}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors hover:bg-hover',
              pathname === to
                ? 'bg-primary/[0.075] font-semibold text-primary'
                : 'text-foreground/75',
            )}
          >
            <Icon size={17} strokeWidth={1.7} />
            <span className="flex-1">{name}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  'min-w-5 text-center text-[11px]',
                  pathname === to ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {count}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mb-3 mt-9 flex items-center justify-between px-3">
        <h2 className="text-[11px] font-medium text-muted-foreground">내 리스트</h2>
        <button
          aria-label="리스트 추가"
          onClick={() => {
            setName('')
            setDialog('list')
          }}
          className="rounded p-1 text-muted-foreground hover:bg-hover"
        >
          <Plus size={14} />
        </button>
      </div>
      <nav aria-label="내 리스트" className="flex max-h-[30vh] flex-col gap-1 overflow-y-auto">
        {state.lists
          .filter((list) => list.kind === 'list')
          .map((list) => (
            <Link
              key={list.id}
              to="/app/lists/$listId"
              params={{ listId: list.id }}
              search={{}}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-3 rounded-lg px-3 text-[13px] hover:bg-hover',
                pathname.endsWith(list.id) && 'bg-primary/[0.075] text-primary',
              )}
            >
              <LayoutList
                size={16}
                style={{
                  color:
                    list.color.toLowerCase() === '#002fa7' ? 'var(--color-primary)' : list.color,
                }}
              />
              <span className="min-w-0 flex-1 truncate">{list.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {state.tasks.filter(
                  (task) => task.listId === list.id && task.status === 'open' && !task.deletedAt,
                ).length || ''}
              </span>
            </Link>
          ))}
        {state.lists.length === 1 && (
          <button
            className="mx-3 flex items-center gap-2 rounded-lg border border-dashed border-control/70 px-3 py-3 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
            onClick={() => {
              setName('')
              setDialog('list')
            }}
          >
            <Plus size={13} />첫 리스트 만들기
          </button>
        )}
      </nav>
      <div className="mb-3 mt-8 flex items-center justify-between px-3">
        <h2 className="text-[11px] font-medium text-muted-foreground">태그</h2>
        <button
          aria-label="태그 추가"
          onClick={() => {
            setName('')
            setDialog('tag')
          }}
          className="rounded p-1 text-muted-foreground hover:bg-hover"
        >
          <Plus size={14} />
        </button>
      </div>
      <nav aria-label="태그 필터" className="flex max-h-32 flex-col gap-1 overflow-y-auto">
        {state.tags.map((tag) => (
          <button
            key={tag.id}
            aria-pressed={search.tag === tag.id}
            onClick={() => {
              setSearch({ tag: search.tag === tag.id ? undefined : tag.id })
              setSidebarOpen(false)
            }}
            className={cn(
              'flex h-8 shrink-0 items-center gap-3 rounded-lg px-3 text-xs text-muted-foreground hover:bg-hover',
              search.tag === tag.id && 'bg-primary/[0.075] text-primary',
            )}
          >
            <Hash size={14} />
            {tag.name}
          </button>
        ))}
        {!state.tags.length && (
          <p className="px-3 text-[11px] leading-5 text-muted-foreground/75">
            태그로 할 일을 연결해 보세요.
          </p>
        )}
      </nav>
      <div className="mt-auto pt-9">
        <Link
          to="/app/trash"
          onClick={() => setSidebarOpen(false)}
          className="mb-5 flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 size={15} />
          휴지통
        </Link>
        <div className="border-t border-border pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-hover">
                <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary">
                  {session.user.name.slice(0, 1)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-xs font-medium">
                    {session.user.name}의 작업 공간
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {session.mode === 'local' ? '이 컴퓨터에 저장' : '개인 워크스페이스'}
                  </span>
                </span>
                <ChevronsUpDown size={13} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  setZone(state.workspace.timeZone)
                  setDialog('settings')
                }}
              >
                <Settings2 size={14} />
                설정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={busy}
                onSelect={() => {
                  void logout()
                }}
              >
                <LogOut size={14} />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        본문으로 건너뛰기
      </a>
      <aside className="hidden w-[236px] shrink-0 border-r border-border md:block">{sidebar}</aside>
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent sheet className="right-auto left-0 max-w-[290px] p-0">
          <DialogTitle className="sr-only">작업 공간 탐색</DialogTitle>
          <DialogDescription className="sr-only">목록과 캘린더로 이동합니다.</DialogDescription>
          {sidebar}
        </DialogContent>
      </Dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-border px-5 lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="탐색 메뉴 열기"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={19} />
          </Button>
          <div className="hidden items-center gap-2.5 text-xs sm:flex">
            <span className="text-muted-foreground">작업 공간</span>
            <span className="text-border">/</span>
            <span className="font-medium">{title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-muted-foreground" />
              <input
                type="search"
                aria-label="현재 화면에서 할 일 검색"
                value={search.q ?? ''}
                onChange={(event) => setSearch({ q: event.target.value || undefined })}
                placeholder="할 일 검색"
                className="h-9 w-40 rounded-lg border-0 bg-secondary pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/15 sm:w-52"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="필터와 정렬">
                  <SlidersHorizontal size={16} />
                  {(search.tag || search.priority !== undefined) && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <h2 className="mb-4 text-sm font-semibold">필터와 정렬</h2>
                <label className="mb-4 block text-xs text-muted-foreground">
                  우선순위
                  <Select
                    className="mt-2"
                    value={search.priority ?? ''}
                    onChange={(event) =>
                      setSearch({
                        priority:
                          event.target.value === '' ? undefined : Number(event.target.value),
                      })
                    }
                  >
                    <option value="">모든 우선순위</option>
                    <option value="3">높음</option>
                    <option value="2">보통</option>
                    <option value="1">낮음</option>
                    <option value="0">없음</option>
                  </Select>
                </label>
                <label className="block text-xs text-muted-foreground">
                  정렬
                  <Select
                    className="mt-2"
                    value={search.sort ?? (pathname.includes('/lists/') ? 'manual' : 'date')}
                    onChange={(event) =>
                      setSearch({ sort: event.target.value as 'manual' | 'date' | 'priority' })
                    }
                  >
                    {pathname.includes('/lists/') && <option value="manual">수동 정렬</option>}
                    <option value="date">일정순</option>
                    <option value="priority">우선순위순</option>
                  </Select>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() =>
                    setSearch({
                      q: undefined,
                      tag: undefined,
                      priority: undefined,
                      sort: undefined,
                    })
                  }
                >
                  <X size={12} />
                  필터 초기화
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between bg-destructive-background px-6 py-2 text-xs text-destructive"
          >
            최신 내용을 가져오지 못했습니다.
            <button
              onClick={() => {
                void refetch()
              }}
              className="underline"
            >
              다시 시도
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          <main id="main-content" className="flex min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <TaskDetailSlot />
        </div>
      </div>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            {dialog === 'settings' ? '작업 공간 설정' : dialog === 'list' ? '새 리스트' : '새 태그'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {dialog === 'settings'
              ? '화면 모드와 일정의 표시 시간대를 설정하세요.'
              : dialog === 'list'
                ? '함께 관리할 할 일을 하나의 리스트에 담으세요.'
                : '여러 리스트의 할 일을 태그로 연결하세요.'}
          </DialogDescription>
          {dialog === 'settings' ? (
            <div className="flex flex-col gap-4">
              <ThemeSelector />
              <div className="my-1 h-px bg-border" />
              <label className="text-xs text-muted-foreground">
                시간대
                <Select
                  className="mt-2"
                  value={zone}
                  onChange={(event) => setZone(event.target.value)}
                >
                  {[
                    'Asia/Seoul',
                    'Asia/Tokyo',
                    'Asia/Shanghai',
                    'UTC',
                    'America/New_York',
                    'America/Los_Angeles',
                    'Europe/London',
                    'Europe/Berlin',
                    'Australia/Sydney',
                  ].map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>
              </label>
              {session.mode === 'local' && (
                <p className="text-xs leading-6 text-muted-foreground">
                  로컬 개발 모드 · 이 컴퓨터의 .data/dayflow.json 파일에 저장됩니다. 클라우드
                  동기화는 연결되지 않았습니다.
                </p>
              )}
              <Button
                onClick={() => {
                  void saveZone()
                }}
                disabled={busy}
              >
                설정 저장
              </Button>
            </div>
          ) : (
            <form onSubmit={create} className="flex flex-col gap-4">
              <Input
                autoFocus
                aria-label={dialog === 'list' ? '리스트 이름' : '태그 이름'}
                placeholder={dialog === 'list' ? '예: 개인 프로젝트' : '예: 집중'}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={dialog === 'list' ? 80 : 40}
              />
              <Button type="submit" disabled={busy || !name.trim()}>
                {busy ? '추가 중…' : '추가'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
