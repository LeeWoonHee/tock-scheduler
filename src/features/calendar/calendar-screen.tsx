import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { workspaceOptions } from '@/features/tasks/queries'
import { TaskComposer } from '@/features/tasks/task-composer'
import { TaskRow } from '@/features/tasks/task-row'
import { useTaskActions } from '@/features/tasks/use-task-actions'
import {
  addDays,
  allDay,
  dateInZone,
  formatDate,
  monthCells,
  scheduleOverlaps,
  shiftMonth,
  moveScheduleToDate,
} from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCurrentTime } from '@/hooks/use-current-time'

export function CalendarScreen() {
  const { data: state } = useQuery(workspaceOptions),
    search = useSearch({ from: '/_app/app' }),
    navigate = useNavigate(),
    actions = useTaskActions()
  const now = useCurrentTime()
  const zone = state!.workspace.timeZone,
    today = dateInZone(now, zone),
    month = search.month ?? today.slice(0, 7),
    cells = monthCells(month)
  const [selected, setSelected] = useState(today),
    [dragOver, setDragOver] = useState<string | null>(null),
    [showDone, setShowDone] = useState(true)
  const tasks = state!.tasks.filter(
    (task) =>
      !task.deletedAt &&
      (showDone || task.status === 'open') &&
      (!search.q || `${task.title} ${task.body}`.toLowerCase().includes(search.q.toLowerCase())) &&
      (!search.tag || task.tagIds.includes(search.tag)) &&
      (search.priority === undefined || task.priority === search.priority),
  )
  const forDay = (date: string) =>
    tasks.filter((task) => scheduleOverlaps(task.schedule, date, addDays(date, 1), zone))
  const inbox = state!.lists.find((list) => list.kind === 'inbox')!
  function go(month: string) {
    void navigate({ to: '.', search: (previous) => ({ ...previous, month }) })
    setSelected(`${month}-01`)
  }
  async function drop(event: React.DragEvent, date: string) {
    event.preventDefault()
    setDragOver(null)
    const id = event.dataTransfer.getData('application/dayflow-task'),
      task = state!.tasks.find((task) => task.id === id)
    if (!task) return
    try {
      const schedule = moveScheduleToDate(task.schedule, date, zone)
      await actions.run('updateTask', task, { patch: { schedule } })
    } catch (error) {
      toast.error((error as Error).message)
    }
  }
  return (
    <section className="flex min-w-0 flex-1 flex-col px-4 pb-14 pt-7 md:px-8 lg:px-10 lg:pt-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays size={14} />
            일정과 할 일을 한눈에
          </p>
          <h1 className="text-[30px] font-semibold tracking-[-0.05em]">
            {Number(month.slice(0, 4))}
            <span className="mx-1 text-muted-foreground/40">.</span>
            <span className="text-primary">{month.slice(5)}</span>
            <span className="ml-3 text-sm font-normal tracking-normal text-muted-foreground">
              월간 캘린더
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="mr-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(event) => setShowDone(event.target.checked)}
            />
            완료 표시
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              go(today.slice(0, 7))
              setSelected(today)
            }}
          >
            오늘
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="이전 달"
            onClick={() => go(shiftMonth(month, -1))}
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="다음 달"
            onClick={() => go(shiftMonth(month, 1))}
          >
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap border-b border-border">
        {['월', '화', '수', '목', '금', '토', '일'].map((name, index) => (
          <span
            key={name}
            className={cn(
              'w-[calc(100%/7)] pb-3 text-center text-[11px]',
              index === 6 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {name}
          </span>
        ))}
      </div>
      <div
        role="group"
        aria-label={`${month} 월간 일정`}
        className="flex flex-wrap border-l border-border"
      >
        {cells.map((date, index) => {
          const dayTasks = forDay(date)
          return (
            <div
              key={date}
              className={cn(
                'flex min-h-[100px] w-[calc(100%/7)] min-w-0 flex-col border-b border-r border-border p-1 md:min-h-[115px] md:p-2',
                date.slice(0, 7) !== month && 'bg-secondary/70',
                selected === date && 'bg-primary/[0.025]',
                dragOver === date && 'bg-primary/10 ring-1 ring-inset ring-primary',
              )}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('application/dayflow-task')) {
                  event.preventDefault()
                  setDragOver(date)
                }
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => {
                void drop(event, date)
              }}
            >
              <button
                aria-label={`${formatDate(date)}, 할 일 ${dayTasks.length}개`}
                aria-pressed={selected === date}
                onClick={() => setSelected(date)}
                className={cn(
                  'mb-1 flex size-7 shrink-0 items-center justify-center self-center rounded-full text-xs tabular-nums transition hover:bg-primary/10',
                  date === today
                    ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary'
                    : selected === date
                      ? 'border border-primary/40 text-primary'
                      : index % 7 === 6
                        ? 'text-destructive'
                        : date.slice(0, 7) !== month
                          ? 'text-muted-foreground/50'
                          : 'text-foreground',
                )}
              >
                {Number(date.slice(8))}
              </button>
              {dayTasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/dayflow-task', task.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => {
                    setSelected(date)
                    void navigate({
                      to: '.',
                      search: (previous) => ({ ...previous, task: task.id }),
                    })
                  }}
                  className={cn(
                    'mb-1 flex min-h-5 shrink-0 items-center gap-1 overflow-hidden rounded border-l-2 border-primary bg-primary/5 px-1 text-left text-[10px] leading-5 text-primary',
                    task.status === 'done' &&
                      'border-control bg-secondary text-muted-foreground line-through',
                  )}
                >
                  <span className="truncate">{task.title}</span>
                </button>
              ))}
              {dayTasks.length > 3 && (
                <button
                  onClick={() => setSelected(date)}
                  className="py-0.5 text-left text-[9px] text-muted-foreground"
                >
                  +{dayTasks.length - 3}개 더 보기
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <section className="min-w-0 flex-1">
          <h2 className="mb-4 text-sm font-semibold">
            {formatDate(selected, today)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {forDay(selected).length}개
            </span>
          </h2>
          <TaskComposer
            key={selected}
            listId={inbox.id}
            defaultSchedule={allDay(selected)}
            zone={zone}
          />
          {forDay(selected).map((task) => (
            <TaskRow key={task.id} task={task} showList />
          ))}
          {!forDay(selected).length && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              이 날짜에 예정된 할 일이 없어요.
            </p>
          )}
        </section>
        <section className="min-w-0 flex-1 lg:max-w-[280px]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Plus size={14} className="text-muted-foreground" />
            날짜 미정
          </h2>
          <p className="mb-3 text-[11px] leading-6 text-muted-foreground">
            날짜 칸으로 드래그하거나, 할 일의 날짜 메뉴에서 일정을 정하세요.
          </p>
          {tasks
            .filter((task) => !task.schedule && task.status === 'open')
            .map((task) => (
              <div
                draggable
                key={task.id}
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/dayflow-task', task.id)
                }}
              >
                <TaskRow task={task} />
              </div>
            ))}
          {!tasks.some((task) => !task.schedule && task.status === 'open') && (
            <p className="border-t border-border py-6 text-xs text-muted-foreground">
              날짜를 정하지 않은 할 일이 없어요.
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
