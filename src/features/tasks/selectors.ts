import type { Task, View, WorkspaceDTO } from './types'
import { addDays, dateInZone, isOverdue, scheduleOverlaps } from '@/lib/dates'

export function selectTasks(
  state: WorkspaceDTO,
  view: View,
  listId?: string,
  now = new Date(),
): Task[] {
  const zone = state.workspace.timeZone,
    today = dateInZone(now, zone),
    inbox = state.lists.find((list) => list.kind === 'inbox')
  return state.tasks.filter((task) => {
    if (view === 'trash') return !!task.deletedAt
    if (task.deletedAt) return false
    if (view === 'inbox') return task.listId === inbox?.id
    if (view === 'list') return task.listId === listId
    if (view === 'today')
      return task.status === 'done'
        ? !!task.completedAt && dateInZone(task.completedAt, zone) === today
        : isOverdue(task, today, zone) ||
            scheduleOverlaps(task.schedule, today, addDays(today, 1), zone)
    if (view === 'upcoming')
      return (
        task.status === 'open' &&
        scheduleOverlaps(task.schedule, addDays(today, 1), addDays(today, 8), zone)
      )
    return !!task.schedule
  })
}
