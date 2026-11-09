import { useRef, useState } from 'react'
import { Plus, CornerDownLeft, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createTask } from '@/server/functions/tasks'
import { Button } from '@/components/ui/button'
import { SchedulePicker } from './schedule-picker'
import { unwrap, workspaceOptions } from './queries'
import type { Schedule } from './types'

export function TaskComposer({
  listId,
  defaultSchedule = null,
  sectionId = null,
  zone,
}: {
  listId: string
  defaultSchedule?: Schedule | null
  sectionId?: string | null
  zone: string
}) {
  const [title, setTitle] = useState(''),
    [schedule, setSchedule] = useState<Schedule | null>(defaultSchedule),
    [active, setActive] = useState(false)
  const composing = useRef(false),
    input = useRef<HTMLInputElement>(null),
    client = useQueryClient()
  const attempt = useRef<{ fingerprint: string; requestId: string } | null>(null)
  const mutation = useMutation({
    mutationFn: async (data: {
      title: string
      listId: string
      sectionId: string | null
      schedule: Schedule | null
      requestId: string
    }) => unwrap(await createTask({ data })),
    retry: 1,
    onSuccess: async () => {
      attempt.current = null
      setTitle('')
      input.current?.focus()
      await client.invalidateQueries(workspaceOptions)
    },
    onError: (error) => toast.error(error.message),
  })
  function submit() {
    if (!title.trim() || mutation.isPending || composing.current) return
    const fingerprint = JSON.stringify({ title, listId, sectionId, schedule })
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, requestId: crypto.randomUUID() }
    mutation.mutate({ title, listId, sectionId, schedule, requestId: attempt.current!.requestId })
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className={`mb-7 rounded-xl border bg-card transition ${active ? 'border-primary/35 ring-2 ring-primary/10' : 'border-border hover:border-control'}`}
    >
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <Plus size={19} className="shrink-0 text-primary" />
        <input
          ref={input}
          aria-label="새 할 일"
          placeholder="새로운 할 일을 입력하세요"
          value={title}
          maxLength={500}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={() => {
            composing.current = false
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              (event.nativeEvent.isComposing || composing.current || event.keyCode === 229)
            )
              event.preventDefault()
          }}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          disabled={mutation.isPending}
        />
      </div>
      <div className="flex items-center justify-between pb-2 pl-10 pr-2 pt-1">
        <SchedulePicker zone={zone} value={schedule} onChange={setSchedule} />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex">
            Enter로 추가
            <CornerDownLeft size={11} />
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!title.trim() || mutation.isPending}
            aria-label="할 일 추가"
          >
            {mutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            추가
          </Button>
        </div>
      </div>
    </form>
  )
}
