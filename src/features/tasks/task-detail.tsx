import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Check, CheckCheck, ChevronRight, Flag, Hash, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getTask } from '@/server/functions/tasks'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { workspaceOptions, unwrap, ApiError } from './queries'
import { useTaskActions } from './use-task-actions'
import { SchedulePicker } from './schedule-picker'
import { priorityNames, priorityColors } from './task-row'
import type { Task, Schedule } from './types'
import { cn } from '@/lib/utils'
import { addDays, allDay, dateInZone, localDateTime, fromLocalDateTime } from '@/lib/dates'
import { draftPatch } from './draft'

export function TaskDetailSlot() {
  const search = useSearch({ from: '/_app/app' }),
    navigate = useNavigate(),
    { data: state } = useQuery(workspaceOptions)
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const id = search.task
  const query = useQuery({
    queryKey: ['task', id],
    queryFn: async () => unwrap(await getTask({ data: id })),
    enabled: !!id,
    retry: false,
  })
  function close() {
    void navigate({ to: '.', search: (previous) => ({ ...previous, task: undefined }) })
    if (id)
      setTimeout(() => {
        document
          .querySelector<HTMLButtonElement>(`[data-task-trigger="${CSS.escape(id)}"]`)
          ?.focus()
      }, 50)
  }
  if (!id || !state) return null
  const task = state.tasks.find((task) => task.id === id && !task.deletedAt)
  const body = query.isLoading ? (
    <div
      role="status"
      className="flex flex-1 items-center justify-center gap-2 p-8 text-sm text-muted-foreground"
    >
      <Loader2 className="animate-spin" size={16} />
      상세 불러오는 중
    </div>
  ) : query.error || !task ? (
    <div role="alert" className="flex flex-col items-start gap-4 p-8">
      <p className="text-sm">할 일을 찾을 수 없거나 접근할 수 없습니다.</p>
      <Button variant="outline" onClick={close}>
        닫기
      </Button>
    </div>
  ) : (
    <TaskDetail key={id} task={task} close={close} />
  )
  if (mobile)
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent sheet className="gap-0 p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">할 일 상세</DialogTitle>
          <DialogDescription className="sr-only">
            제목, 본문, 일정과 분류를 편집합니다.
          </DialogDescription>
          {body}
        </DialogContent>
      </Dialog>
    )
  return (
    <aside
      aria-label="할 일 상세"
      className="hidden w-[350px] shrink-0 flex-col overflow-y-auto border-l border-border xl:flex 2xl:w-[390px]"
    >
      {body}
    </aside>
  )
}
function TaskDetail({ task, close }: { task: Task; close: () => void }) {
  const { data: state } = useQuery(workspaceOptions),
    actions = useTaskActions()
  const [draft, setDraft] = useState(task),
    [baseVersion, setBaseVersion] = useState(task.version),
    [conflict, setConflict] = useState(false)
  const [baseline, setBaseline] = useState(task)
  const patch = draftPatch(draft, baseline),
    dirty = Object.keys(patch).length > 0
  function update(patch: Partial<Task>) {
    setDraft((value) => ({ ...value, ...patch }))
  }
  useEffect(() => {
    if (!dirty) {
      setDraft(task)
      setBaseline(task)
      setBaseVersion(task.version)
    } else if (task.version !== baseVersion) setConflict(true)
  }, [task.version, dirty])
  async function save(event: React.FormEvent) {
    event.preventDefault()
    try {
      const updated = await actions.run('updateTask', { ...task, version: baseVersion }, { patch })
      setDraft(updated)
      setBaseline(updated)
      setBaseVersion(updated.version)
      setConflict(false)
      toast.success('변경 내용을 저장했어요.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VERSION_CONFLICT') setConflict(true)
    }
  }
  const schedule = draft.schedule,
    zone = state!.workspace.timeZone
  return (
    <form onSubmit={save} className="flex min-h-full flex-col">
      <header className="flex h-[65px] shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <CheckCheck size={14} />할 일 상세
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="할 일 삭제"
            disabled={actions.pending}
            onClick={async () => {
              if (await actions.trash(task)) close()
            }}
          >
            <Trash2 size={15} />
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label="상세 닫기" onClick={close}>
            <X size={17} />
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-1.5"
            checked={task.status === 'done'}
            aria-label="상세에서 완료 상태 변경"
            disabled={actions.pending}
            onCheckedChange={() => {
              void actions.toggle(task)
            }}
          />
          <textarea
            aria-label="할 일 제목"
            value={draft.title}
            maxLength={500}
            onChange={(event) => update({ title: event.target.value })}
            rows={2}
            className={cn(
              'w-full resize-none border-0 bg-transparent text-lg font-semibold leading-7 outline-none focus-visible:outline-none',
              task.status === 'done' && 'text-muted-foreground line-through',
            )}
          />
        </div>
        <div className="flex flex-col gap-4 border-y border-border py-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">리스트</span>
            <Select
              className="w-40 border-0 text-xs"
              aria-label="할 일 리스트"
              value={task.listId}
              disabled={actions.pending || dirty}
              onChange={(event) => {
                void actions
                  .run('moveTask', task, { listId: event.target.value, sectionId: null })
                  .catch(() => {})
              }}
            >
              {state!.lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </div>
          {state!.lists.find((list) => list.id === task.listId)?.kind === 'list' && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">섹션</span>
              <Select
                className="w-40 border-0 text-xs"
                aria-label="할 일 섹션"
                value={task.sectionId ?? ''}
                disabled={actions.pending || dirty}
                onChange={(event) => {
                  void actions
                    .run('moveTask', task, {
                      listId: task.listId,
                      sectionId: event.target.value || null,
                    })
                    .catch(() => {})
                }}
              >
                <option value="">섹션 없음</option>
                {state!.sections
                  .filter((section) => section.listId === task.listId)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">우선순위</span>
            <div className="flex w-40 items-center gap-1">
              <Flag size={13} className={priorityColors[draft.priority]} />
              <Select
                aria-label="우선순위"
                className="border-0 text-xs"
                value={draft.priority}
                onChange={(event) =>
                  update({ priority: Number(event.target.value) as Task['priority'] })
                }
              >
                {priorityNames.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">일정</span>
            <SchedulePicker
              zone={zone}
              value={schedule}
              onChange={(schedule) => update({ schedule })}
            />
          </div>
          <details className="rounded-lg bg-secondary px-3 py-2.5">
            <summary className="cursor-pointer text-[11px] text-muted-foreground">
              기간 및 시각 일정
            </summary>
            <ScheduleFields
              value={schedule}
              zone={zone}
              onChange={(schedule) => update({ schedule })}
            />
          </details>
        </div>
        <div>
          <label
            htmlFor={`body-${task.id}`}
            className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"
          >
            메모
          </label>
          <Textarea
            id={`body-${task.id}`}
            value={draft.body}
            maxLength={20000}
            onChange={(event) => update({ body: event.target.value })}
            placeholder="생각이나 필요한 내용을 적어 두세요."
            className="min-h-[190px] border-0 bg-secondary/70 text-xs leading-7"
          />
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Hash size={13} />
            태그
          </p>
          <div className="flex flex-wrap gap-2">
            {state!.tags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                aria-pressed={draft.tagIds.includes(tag.id)}
                onClick={() =>
                  update({
                    tagIds: draft.tagIds.includes(tag.id)
                      ? draft.tagIds.filter((id) => id !== tag.id)
                      : [...draft.tagIds, tag.id],
                  })
                }
                className={cn(
                  'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                  draft.tagIds.includes(tag.id)
                    ? 'border-primary/20 bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {draft.tagIds.includes(tag.id) && <Check size={11} />}#{tag.name}
              </button>
            ))}
            {!state!.tags.length && (
              <p className="text-[11px] leading-5 text-muted-foreground">
                탐색 메뉴의 + 버튼에서 태그를 먼저 추가하세요.
              </p>
            )}
          </div>
        </div>
        {conflict && (
          <div
            role="alert"
            className="rounded-lg border border-warning-border bg-warning-background p-3 text-xs leading-6 text-warning"
          >
            <p>다른 창에서 수정되었습니다. 현재 입력은 유지됩니다.</p>
            <button
              type="button"
              className="mt-1 underline"
              onClick={() => {
                setBaseVersion(task.version)
                setConflict(false)
              }}
            >
              최신 버전 확인 후 내 수정 다시 적용
            </button>
            <p className="text-[10px]">최신 제목: {task.title}</p>
          </div>
        )}
        <div className="mt-auto border-t border-border pt-5">
          <p className="mb-3 text-[10px] text-muted-foreground">
            {new Intl.DateTimeFormat('ko', { dateStyle: 'medium', timeZone: zone }).format(
              new Date(task.createdAt),
            )}{' '}
            생성{dirty ? ' · 저장하지 않은 변경' : ''}
          </p>
          <Button
            type="submit"
            className="w-full"
            disabled={!dirty || !draft.title.trim() || actions.pending}
          >
            {actions.pending ? <Loader2 size={14} className="animate-spin" /> : null}변경 내용 저장
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </form>
  )
}
function ScheduleFields({
  value,
  zone,
  onChange,
}: {
  value: Schedule | null
  zone: string
  onChange: (value: Schedule | null) => void
}) {
  const date = value?.kind === 'allDay' ? value.startDate : dateInZone(new Date(), zone)
  function timed(field: 'startAt' | 'endAt', text: string) {
    try {
      const instant = text ? fromLocalDateTime(text, zone) : null
      if (field === 'startAt' && !instant) return
      onChange({
        kind: 'timed',
        startAt: value?.kind === 'timed' ? value.startAt : new Date().toISOString(),
        endAt: value?.kind === 'timed' ? value.endAt : null,
        zoneId: zone,
        [field]: instant,
      } as Schedule)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }
  return (
    <div className="mt-4 flex flex-col gap-3">
      <label className="flex items-center justify-between text-xs">
        종일 일정
        <input
          type="checkbox"
          checked={value?.kind !== 'timed'}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? allDay(date)
                : { kind: 'timed', startAt: new Date().toISOString(), endAt: null, zoneId: zone },
            )
          }
        />
      </label>
      {value?.kind === 'timed' ? (
        <>
          <label className="text-[11px] text-muted-foreground">
            시작 시각
            <Input
              className="mt-1.5 text-xs"
              type="datetime-local"
              value={localDateTime(value.startAt, zone)}
              onChange={(event) => timed('startAt', event.target.value)}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            종료 시각 (선택)
            <Input
              className="mt-1.5 text-xs"
              type="datetime-local"
              value={value.endAt ? localDateTime(value.endAt, zone) : ''}
              onChange={(event) => timed('endAt', event.target.value)}
            />
          </label>
          <p className="text-[10px] text-muted-foreground">표시 및 입력 시간대: {zone}</p>
        </>
      ) : (
        <>
          <label className="text-[11px] text-muted-foreground">
            시작 날짜
            <Input
              type="date"
              className="mt-1.5 text-xs"
              value={value?.startDate ?? ''}
              onChange={(event) => {
                if (event.target.value) onChange(allDay(event.target.value))
              }}
            />
          </label>
          <label className="text-[11px] text-muted-foreground">
            마지막 날짜 (포함)
            <Input
              type="date"
              className="mt-1.5 text-xs"
              min={value?.startDate}
              value={value ? addDays(value.endDateExclusive, -1) : ''}
              onChange={(event) => {
                if (event.target.value)
                  onChange({
                    kind: 'allDay',
                    startDate: date,
                    endDateExclusive: addDays(event.target.value, 1),
                  })
              }}
            />
          </label>
        </>
      )}
    </div>
  )
}
