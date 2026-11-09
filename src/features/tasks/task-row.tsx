import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTaskActions } from './use-task-actions'
import { CalendarDays, Flag, GripVertical, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SchedulePicker } from './schedule-picker'
import { useQuery } from '@tanstack/react-query'
import { workspaceOptions } from './queries'
import type { Task } from './types'
import { cn } from '@/lib/utils'
import { dateInZone, isOverdue } from '@/lib/dates'

export const priorityNames = ['우선순위 없음', '낮음', '보통', '높음']
export const priorityColors = [
  'text-muted-foreground',
  'text-blue-500 dark:text-blue-300',
  'text-amber-600 dark:text-amber-300',
  'text-destructive',
]
export function TaskRow({
  task,
  manual = false,
  onDropBefore,
  showList = false,
}: {
  task: Task
  manual?: boolean
  onDropBefore?: (id: string) => void
  showList?: boolean
}) {
  const { data: state } = useQuery(workspaceOptions),
    actions = useTaskActions(),
    navigate = useNavigate(),
    search = useSearch({ from: '/_app/app' })
  const zone = state!.workspace.timeZone,
    list = state!.lists.find((list) => list.id === task.listId)
  function select() {
    void navigate({ to: '.', search: (previous) => ({ ...previous, task: task.id }) })
  }
  const overdue = isOverdue(task, dateInZone(new Date(), zone), zone)
  return (
    <div
      className={cn(
        'group relative flex min-h-[66px] items-center gap-3 border-b border-border px-2 transition-colors hover:bg-secondary/70',
        search.task === task.id && 'bg-primary/[0.035]',
      )}
      draggable={manual}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/dayflow-task', task.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(event) => {
        if (manual && event.dataTransfer.types.includes('application/dayflow-task')) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }
      }}
      onDrop={(event) => {
        if (!manual) return
        event.preventDefault()
        event.stopPropagation()
        const id = event.dataTransfer.getData('application/dayflow-task')
        if (id && id !== task.id) onDropBefore?.(id)
      }}
    >
      {manual && (
        <GripVertical
          size={13}
          aria-hidden
          className="absolute -left-3 hidden text-muted-foreground group-hover:block"
        />
      )}
      {!task.deletedAt && (
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={() => {
            void actions.toggle(task)
          }}
          disabled={actions.pending}
          aria-label={`${task.title} ${task.status === 'done' ? '완료 취소' : '완료'}`}
          className={
            task.priority === 3
              ? 'border-red-400'
              : task.priority === 2
                ? 'border-amber-400'
                : undefined
          }
        />
      )}
      <button
        data-task-trigger={task.id}
        onClick={select}
        className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${task.title} 상세 열기`}
      >
        <span
          className={cn(
            'truncate text-[13px] font-medium leading-5',
            task.status === 'done' && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </span>
        {(task.body || task.tagIds.length > 0 || showList) && (
          <span className="flex max-w-full items-center gap-2 overflow-hidden text-[10px] text-muted-foreground">
            {showList && <span className="shrink-0">{list?.name ?? 'Inbox'}</span>}
            {task.tagIds.slice(0, 2).map((id) => (
              <span key={id} className="truncate text-primary/70">
                #{state!.tags.find((tag) => tag.id === id)?.name}
              </span>
            ))}
            {task.body && <span className="truncate">{task.body.slice(0, 80)}</span>}
          </span>
        )}
      </button>
      <div className={cn('hidden shrink-0 sm:block', overdue && '[&_button]:text-destructive')}>
        <SchedulePicker
          compact
          disabled={actions.pending || !!task.deletedAt}
          zone={zone}
          value={task.schedule}
          onChange={(schedule) => {
            void actions.run('updateTask', task, { patch: { schedule } }).catch(() => {})
          }}
        />
      </div>
      {task.priority > 0 && (
        <Flag
          size={13}
          className={cn('shrink-0', priorityColors[task.priority])}
          aria-label={`우선순위 ${priorityNames[task.priority]}`}
        />
      )}
      {task.deletedAt ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={actions.pending}
          onClick={() => {
            void actions.run('restoreTask', task).catch(() => {})
          }}
        >
          <RotateCcw size={13} />
          복원
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`${task.title} 더 보기`}
              className="size-7 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={select}>
              <CalendarDays size={14} />
              상세 및 일정 수정
            </DropdownMenuItem>
            {state!.lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                disabled={task.listId === list.id}
                onSelect={() => {
                  void actions
                    .run('moveTask', task, { listId: list.id, sectionId: null })
                    .catch(() => {})
                }}
              >
                {list.name}로 이동
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => {
                void actions.trash(task)
              }}
            >
              <Trash2 size={14} />
              휴지통으로 이동
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
