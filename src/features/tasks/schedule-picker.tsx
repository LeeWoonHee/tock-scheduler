import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Schedule } from './types'
import { addDays, allDay, dateInZone, formatDate, scheduleDate } from '@/lib/dates'

export function SchedulePicker({
  value,
  onChange,
  zone,
  compact = false,
  disabled = false,
}: {
  value: Schedule | null
  onChange: (value: Schedule | null) => void
  zone: string
  compact?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false),
    today = dateInZone(new Date(), zone)
  const date = scheduleDate(value, zone)
  function pick(date: string) {
    onChange(allDay(date))
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          className={date ? 'text-primary' : 'text-muted-foreground'}
        >
          <CalendarDays size={compact ? 13 : 15} />
          {date ? formatDate(date, today) : '날짜 없음'}
          {value?.kind === 'timed' && (
            <span className="tabular-nums">
              {new Intl.DateTimeFormat('ko', {
                timeZone: zone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(new Date(value.startAt))}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="mb-3 font-semibold">일정 설정</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => pick(today)}>
            오늘
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => pick(addDays(today, 1))}
          >
            내일
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => pick(addDays(today, 7))}
          >
            일주일 뒤
          </Button>
        </div>
        <label className="mb-1.5 mt-4 block text-xs text-muted-foreground">
          직접 날짜 선택
          <Input
            aria-label="일정 날짜"
            type="date"
            value={date ?? ''}
            onChange={(event) => {
              if (event.target.value) pick(event.target.value)
            }}
            className="mt-2"
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-2 w-full justify-start"
          onClick={() => {
            onChange(null)
            setOpen(false)
          }}
        >
          <X size={14} />
          날짜 지우기
        </Button>
      </PopoverContent>
    </Popover>
  )
}
