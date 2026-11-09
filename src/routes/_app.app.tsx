import { createFileRoute } from '@tanstack/react-router'
import { workspaceOptions } from '@/features/tasks/queries'
import { AppShell } from '@/components/app-shell'
export type AppSearch = {
  task?: string
  month?: string
  q?: string
  tag?: string
  priority?: number
  sort?: 'date' | 'priority' | 'manual'
}
export const Route = createFileRoute('/_app/app')({
  validateSearch: (search: Record<string, unknown>): AppSearch => ({
    task: typeof search.task === 'string' ? search.task : undefined,
    month:
      typeof search.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.month)
        ? search.month
        : undefined,
    q: typeof search.q === 'string' ? search.q.slice(0, 500) : undefined,
    tag: typeof search.tag === 'string' ? search.tag : undefined,
    priority:
      typeof search.priority === 'number' &&
      Number.isInteger(search.priority) &&
      search.priority >= 0 &&
      search.priority <= 3
        ? search.priority
        : undefined,
    sort:
      search.sort === 'date' || search.sort === 'priority' || search.sort === 'manual'
        ? search.sort
        : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceOptions),
  component: AppShell,
  pendingComponent: () => (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      작업 공간 불러오는 중
    </div>
  ),
})
