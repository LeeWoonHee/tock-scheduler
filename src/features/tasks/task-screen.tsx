import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDownWideNarrow,
  Check,
  ChevronDown,
  ChevronRight,
  Inbox,
  Layers,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { workspaceOptions, unwrap } from './queries'
import { selectTasks } from './selectors'
import { TaskComposer } from './task-composer'
import { TaskRow } from './task-row'
import { useTaskActions } from './use-task-actions'
import {
  addDays,
  allDay,
  compareTasks,
  dateInZone,
  formatDate,
  isOverdue,
  scheduleDate,
} from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createSection } from '@/server/functions/tasks'
import type { Task, View } from './types'
import { useCurrentTime } from '@/hooks/use-current-time'

export function TaskScreen({ view, listId }: { view: View; listId?: string }) {
  const { data: state } = useQuery(workspaceOptions),
    search = useSearch({ from: '/_app/app' }),
    actions = useTaskActions(),
    client = useQueryClient()
  const [doneOpen, setDoneOpen] = useState(true),
    [sectionDialog, setSectionDialog] = useState(false),
    [sectionName, setSectionName] = useState(''),
    [creating, setCreating] = useState(false)
  const now = useCurrentTime()
  if (!state) return null
  const zone = state.workspace.timeZone,
    today = dateInZone(now, zone),
    list = state.lists.find((list) => list.id === listId)
  const title =
    view === 'inbox'
      ? 'Inbox'
      : view === 'today'
        ? '오늘'
        : view === 'upcoming'
          ? '다가오는 일정'
          : view === 'trash'
            ? '휴지통'
            : (list?.name ?? '리스트를 찾을 수 없습니다')
  const description =
    view === 'inbox'
      ? '머릿속의 생각을 모아 두는 곳'
      : view === 'today'
        ? '중요한 일부터, 하나씩 시작해 보세요.'
        : view === 'upcoming'
          ? '내일부터 일주일, 한눈에 준비하세요.'
          : view === 'trash'
            ? '삭제한 할 일을 다시 복원할 수 있어요.'
            : '해야 할 일을 나누고, 나만의 순서로 정리하세요.'
  const source = selectTasks(state, view, listId, now),
    tasks = source
      .filter(
        (task) =>
          (!search.q ||
            `${task.title} ${task.body}`.toLowerCase().includes(search.q.toLowerCase())) &&
          (!search.tag || task.tagIds.includes(search.tag)) &&
          (search.priority === undefined || task.priority === search.priority),
      )
      .sort((a, b) =>
        compareTasks(a, b, search.sort ?? (view === 'list' ? 'manual' : 'date'), zone),
      )
  const open = tasks.filter((task) => task.status === 'open'),
    done = tasks.filter((task) => task.status === 'done'),
    overdue = open.filter((task) => isOverdue(task, today, zone))
  const inbox = state.lists.find((list) => list.kind === 'inbox')!,
    manual = view === 'list' && (search.sort ?? 'manual') === 'manual'
  const Icon =
    view === 'inbox' ? Inbox : view === 'today' ? Sun : view === 'trash' ? Trash2 : Layers
  const upcomingDate = (task: Task) => {
    const start = scheduleDate(task.schedule, zone) ?? addDays(today, 1)
    return start < addDays(today, 1) ? addDays(today, 1) : start
  }
  const groups: { id: string; name: string; tasks: Task[] }[] =
    view === 'today'
      ? [
          { id: 'overdue', name: '기한 초과', tasks: overdue },
          {
            id: 'today',
            name: '오늘 할 일',
            tasks: open.filter((task) => !isOverdue(task, today, zone)),
          },
        ]
      : view === 'upcoming'
        ? Array.from(new Set(open.map(upcomingDate)))
            .sort()
            .map((date) => ({
              id: date,
              name: formatDate(date, today),
              tasks: open.filter((task) => upcomingDate(task) === date),
            }))
        : view === 'list'
          ? [
              { id: 'none', name: '할 일', tasks: open.filter((task) => !task.sectionId) },
              ...state.sections
                .filter((section) => section.listId === listId)
                .sort((a, b) => a.position - b.position)
                .map((section) => ({
                  id: section.id,
                  name: section.name,
                  tasks: open.filter((task) => task.sectionId === section.id),
                })),
            ]
          : [
              {
                id: 'all',
                name: view === 'trash' ? '삭제된 할 일' : '할 일',
                tasks: view === 'trash' ? tasks : open,
              },
            ]
  async function addSection(event: React.FormEvent) {
    event.preventDefault()
    if (!sectionName.trim() || !listId) return
    setCreating(true)
    try {
      unwrap(
        await createSection({
          data: { listId, name: sectionName, requestId: crypto.randomUUID() },
        }),
      )
      await client.invalidateQueries(workspaceOptions)
      setSectionDialog(false)
      setSectionName('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setCreating(false)
    }
  }
  function drop(taskId: string, before: Task) {
    const task = state!.tasks.find((task) => task.id === taskId)
    if (task && manual)
      void actions
        .run('moveTask', task, {
          listId: before.listId,
          sectionId: before.sectionId,
          beforeId: before.id,
        })
        .catch(() => {})
  }
  return (
    <motion.section
      key={`${view}-${listId}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-5 pb-20 pt-8 md:px-10 lg:px-14 lg:pt-11"
    >
      <header className="mb-9 flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Icon size={14} />
            <span>{view === 'today' ? formatDate(today) : '나의 작업 공간'}</span>
          </div>
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.055em]">
            {title}
            <span className="ml-3 inline-block align-middle text-xl font-normal text-muted-foreground/45">
              {view === 'trash' ? tasks.length : open.length}
            </span>
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{description}</p>
        </div>
        {view === 'today' && (
          <div className="hidden items-center gap-3 pt-3 sm:flex">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              aria-label={`오늘 ${source.filter((task) => task.status === 'done').length}/${source.length}개 완료`}
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${source.length ? (source.filter((task) => task.status === 'done').length / source.length) * 125.66 : 0} 125.66`}
                transform="rotate(-90 24 24)"
              />
              <text
                x="24"
                y="28"
                textAnchor="middle"
                className="fill-foreground text-[12px] font-medium"
              >
                {source.length
                  ? Math.round(
                      (source.filter((task) => task.status === 'done').length / source.length) *
                        100,
                    )
                  : 0}
                %
              </text>
            </svg>
            <div className="text-xs leading-5">
              <p className="font-medium">오늘의 진행</p>
              <p className="text-muted-foreground">
                {source.filter((task) => task.status === 'done').length} / {source.length} 완료
              </p>
            </div>
          </div>
        )}
      </header>
      {view !== 'trash' && (view !== 'list' || list) && (
        <TaskComposer
          key={`${view}-${listId}-${view === 'today' ? today : ''}`}
          listId={listId ?? inbox.id}
          defaultSchedule={view === 'today' ? allDay(today) : null}
          zone={zone}
        />
      )}
      {(search.q || search.tag || search.priority !== undefined) && (
        <p className="mb-4 text-xs text-muted-foreground">
          필터 결과 {tasks.length}개{search.q && ` · “${search.q}”`}
        </p>
      )}
      <div className="mb-2 flex items-center justify-between border-b border-border pb-3">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ArrowDownWideNarrow size={13} />
          {manual
            ? '수동 정렬 · 드래그하여 순서 변경'
            : search.sort === 'priority'
              ? '우선순위순'
              : '일정순'}
        </span>
        {view === 'list' && list && (
          <Button size="sm" variant="ghost" onClick={() => setSectionDialog(true)}>
            <Plus size={13} />
            섹션 추가
          </Button>
        )}
      </div>
      <div className="flex flex-col">
        {groups.map((group) =>
          group.tasks.length > 0 || (view === 'list' && group.id !== 'none') ? (
            <section
              key={group.id}
              aria-label={group.name}
              className="mt-5"
              onDragOver={(event) => {
                if (manual && event.dataTransfer.types.includes('application/dayflow-task'))
                  event.preventDefault()
              }}
              onDrop={(event) => {
                if (!manual) return
                event.preventDefault()
                const task = state.tasks.find(
                  (task) => task.id === event.dataTransfer.getData('application/dayflow-task'),
                )
                if (task)
                  void actions
                    .run('moveTask', task, {
                      listId,
                      sectionId: group.id === 'none' ? null : group.id,
                    })
                    .catch(() => {})
              }}
            >
              <h2
                className={`mb-2 flex items-center gap-2 text-xs font-semibold ${group.id === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                <span
                  className={`size-1.5 rounded-full ${group.id === 'overdue' ? 'bg-destructive-background0' : 'bg-control'}`}
                />
                {group.name}
                <span className="ml-1 font-normal text-muted-foreground/70">
                  {group.tasks.length}
                </span>
              </h2>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  manual={manual}
                  onDropBefore={(id) => drop(id, task)}
                  showList={view === 'today' || view === 'upcoming'}
                />
              ))}
              {!group.tasks.length && (
                <p className="border-b border-dashed border-border px-2 py-6 text-xs text-muted-foreground">
                  아직 이 섹션에 할 일이 없어요.
                </p>
              )}
              {view === 'list' && group.id !== 'none' && (
                <details className="mt-2">
                  <summary className="cursor-pointer py-2 text-xs text-muted-foreground">
                    이 섹션에 추가
                  </summary>
                  <TaskComposer listId={listId!} sectionId={group.id} zone={zone} />
                </details>
              )}
            </section>
          ) : null,
        )}
      </div>
      {!tasks.length && (
        <div className="flex min-h-[310px] flex-col items-center justify-center text-center">
          <span className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-border bg-secondary">
            <Icon size={27} strokeWidth={1.25} className="text-primary/70" />
          </span>
          <h2 className="text-[15px] font-medium">
            {search.q || search.tag || search.priority !== undefined
              ? '일치하는 할 일이 없어요'
              : view === 'today'
                ? '오늘을 위한 여백이 있어요'
                : view === 'trash'
                  ? '휴지통이 비어 있어요'
                  : view === 'upcoming'
                    ? '다가오는 일정이 없어요'
                    : '아직 할 일이 없어요'}
          </h2>
          <p className="mt-2 max-w-xs text-xs leading-6 text-muted-foreground">
            {view === 'trash'
              ? '삭제한 할 일은 이곳에서 복원할 수 있어요.'
              : search.q || search.tag
                ? '검색어나 필터를 바꿔 보세요.'
                : '위 입력란에 첫 번째 할 일을 적어 보세요.'}
          </p>
        </div>
      )}
      {view !== 'trash' && done.length > 0 && (
        <section className="mt-8">
          <button
            className="mb-2 flex items-center gap-2 py-2 text-xs font-medium text-muted-foreground"
            onClick={() => setDoneOpen((value) => !value)}
            aria-expanded={doneOpen}
          >
            {doneOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}완료한 할 일
            <span>{done.length}</span>
          </button>
          <AnimatePresence>
            {doneOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {done.map((task) => (
                  <TaskRow key={task.id} task={task} showList={view === 'today'} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
      {view === 'today' && source.length > 0 && open.length === 0 && (
        <p className="mt-7 flex items-center justify-center gap-2 text-sm text-primary">
          <Check size={16} />
          오늘의 할 일을 모두 마쳤어요.
        </p>
      )}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">섹션 추가</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            리스트 안에서 할 일을 나누어 정리하세요.
          </DialogDescription>
          <form onSubmit={addSection} className="flex flex-col gap-4">
            <Input
              autoFocus
              aria-label="섹션 이름"
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
              maxLength={80}
              placeholder="예: 이번 주"
            />
            <Button type="submit" disabled={creating || !sectionName.trim()}>
              {creating ? '추가 중…' : '섹션 추가'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.section>
  )
}
