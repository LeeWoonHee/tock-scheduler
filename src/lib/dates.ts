import type { Schedule, Task } from '@/features/tasks/types'

const dateFormatters = new Map<string, Intl.DateTimeFormat>()
const dayBoundaries = new Map<string, number>()
function dateFormatter(timeZone: string) {
  let formatter = dateFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    if (dateFormatters.size >= 32) dateFormatters.delete(dateFormatters.keys().next().value!)
    dateFormatters.set(timeZone, formatter)
  }
  return formatter
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}
export function validZone(zone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone })
    return true
  } catch {
    return false
  }
}
export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export function dateInZone(instant: string | Date, timeZone = 'Asia/Seoul') {
  const parts = dateFormatter(timeZone).formatToParts(new Date(instant))
  const get = (type: string) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
// Search the actual local-day boundary, rather than assuming every day lasts 24h.
export function dayStart(date: string, timeZone: string): number {
  const key = `${timeZone}:${date}`,
    cached = dayBoundaries.get(key)
  if (cached !== undefined) return cached
  let low = Date.parse(`${date}T00:00:00Z`) - 36 * 3600000
  let high = low + 72 * 3600000
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (dateInZone(new Date(middle), timeZone) < date) low = middle + 1
    else high = middle
  }
  if (dayBoundaries.size >= 512) dayBoundaries.delete(dayBoundaries.keys().next().value!)
  dayBoundaries.set(key, low)
  return low
}
export function allDay(date: string): Schedule {
  return { kind: 'allDay', startDate: date, endDateExclusive: addDays(date, 1) }
}
export function scheduleDate(schedule: Schedule | null, zone: string): string | null {
  return !schedule
    ? null
    : schedule.kind === 'allDay'
      ? schedule.startDate
      : dateInZone(schedule.startAt, zone)
}
export function scheduleOverlaps(
  schedule: Schedule | null,
  from: string,
  toExclusive: string,
  zone: string,
) {
  if (!schedule) return false
  if (schedule.kind === 'allDay')
    return schedule.startDate < toExclusive && schedule.endDateExclusive > from
  const start = Date.parse(schedule.startAt)
  const end = schedule.endAt ? Date.parse(schedule.endAt) : start
  const left = dayStart(from, zone),
    right = dayStart(toExclusive, zone)
  return schedule.endAt ? start < right && end > left : start >= left && start < right
}
export function isOverdue(task: Task, today: string, zone: string) {
  if (!task.schedule || task.status !== 'open') return false
  return task.schedule.kind === 'allDay'
    ? task.schedule.endDateExclusive <= today
    : Date.parse(task.schedule.endAt ?? task.schedule.startAt) < dayStart(today, zone)
}
export function compareTasks(
  a: Task,
  b: Task,
  sort: 'manual' | 'date' | 'priority' = 'manual',
  zone = 'Asia/Seoul',
) {
  let value = 0
  if (sort === 'date') {
    const start = (task: Task) =>
      !task.schedule
        ? Infinity
        : task.schedule.kind === 'allDay'
          ? dayStart(task.schedule.startDate, zone)
          : Date.parse(task.schedule.startAt)
    const left = start(a),
      right = start(b)
    value = left === right ? 0 : left < right ? -1 : 1
  }
  if (sort === 'priority') value = b.priority - a.priority
  if (sort === 'manual') value = a.position - b.position
  return value || a.id.localeCompare(b.id)
}
export function monthCells(month: string) {
  const first = `${month}-01`
  const weekday = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
  const start = addDays(first, -weekday)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}
export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return date.toISOString().slice(0, 7)
}
export function formatDate(date: string, today?: string) {
  if (date === today) return '오늘'
  if (today && date === addDays(today, 1)) return '내일'
  return new Intl.DateTimeFormat('ko', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}

export function localDateTime(instant: string, zone: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date(instant))
    .replace(' ', 'T')
}

/** Resolve wall-clock input using actual zone offsets; choose the earlier repeated instant. */
export function fromLocalDateTime(value: string, zone: string) {
  const wall = Date.parse(`${value}:00Z`)
  if (!Number.isFinite(wall)) throw new Error('올바른 날짜와 시각을 입력해 주세요.')
  const offsets = new Set(
    [-24, -12, 0, 12, 24].map((hours) => {
      const instant = wall + hours * 3600000
      return Date.parse(`${localDateTime(new Date(instant).toISOString(), zone)}:00Z`) - instant
    }),
  )
  const candidates = [...offsets]
    .map((offset) => wall - offset)
    .filter((instant) => localDateTime(new Date(instant).toISOString(), zone) === value)
    .sort((a, b) => a - b)
  if (!candidates.length)
    throw new Error('이 시간대에 존재하지 않는 시각입니다. 다른 시각을 선택해 주세요.')
  return new Date(candidates[0]).toISOString()
}

export function moveScheduleToDate(
  schedule: Schedule | null,
  date: string,
  zone: string,
): Schedule {
  if (!schedule) return allDay(date)
  if (schedule.kind === 'allDay')
    return {
      kind: 'allDay',
      startDate: date,
      endDateExclusive: addDays(
        date,
        (Date.parse(schedule.endDateExclusive) - Date.parse(schedule.startDate)) / 86400000,
      ),
    }
  const startAt = fromLocalDateTime(
    `${date}T${localDateTime(schedule.startAt, zone).slice(11)}`,
    zone,
  )
  const duration = schedule.endAt ? Date.parse(schedule.endAt) - Date.parse(schedule.startAt) : null
  return {
    ...schedule,
    startAt,
    endAt: duration === null ? null : new Date(Date.parse(startAt) + duration).toISOString(),
  }
}
