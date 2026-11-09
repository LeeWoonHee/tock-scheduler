import { createHash } from 'node:crypto'
import type { z } from 'zod'
import type { Task, TaskPatch, WorkspaceState, WorkspaceDTO } from '@/features/tasks/types'
import type {
  createTaskSchema,
  moveTaskSchema,
  versionedSchema,
  updateTaskSchema,
  listQuerySchema,
  calendarQuerySchema,
} from '@/features/tasks/schemas'
import { compareTasks, scheduleOverlaps } from '@/lib/dates'
import { selectTasks } from '@/features/tasks/selectors'
import { DomainError, notFound } from './errors'
import type { Actor, WorkspaceRepository } from '../repositories/types'

type Versioned = z.infer<typeof versionedSchema>
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(',')}}`
  return JSON.stringify(value)
}
export class TaskService {
  constructor(
    private repository: WorkspaceRepository,
    private now = () => new Date(),
  ) {}
  private async mutate<T>(
    actor: Actor,
    operation: string,
    input: { requestId: string },
    action: (state: WorkspaceState) => T,
  ): Promise<T> {
    const hash = createHash('sha256').update(stable(input)).digest('hex')
    return this.repository.transaction(actor, (state) => {
      const now = this.now()
      state.receipts = state.receipts.filter((receipt) => receipt.expiresAt > now.toISOString())
      const old = state.receipts.find(
        (receipt) =>
          receipt.actorId === actor.id &&
          receipt.requestId === input.requestId &&
          receipt.operation === operation,
      )
      if (old) {
        if (old.inputHash !== hash)
          throw new DomainError('REQUEST_ID_REUSED', '같은 요청 ID에 다른 내용을 보낼 수 없습니다.')
        return structuredClone(old.response) as T
      }
      const response = action(state)
      state.receipts.push({
        actorId: actor.id,
        operation,
        requestId: input.requestId,
        inputHash: hash,
        response: structuredClone(response),
        expiresAt: new Date(now.valueOf() + 86400000).toISOString(),
      })
      return response
    })
  }
  private task(state: WorkspaceState, input: Versioned, includeDeleted = false) {
    const task = state.tasks.find(
      (task) =>
        task.id === input.taskId &&
        task.workspaceId === state.workspace.id &&
        (includeDeleted || !task.deletedAt),
    )
    if (!task) return notFound()
    if (task.version !== input.expectedVersion)
      throw new DomainError(
        'VERSION_CONFLICT',
        '다른 창에서 수정되었습니다. 최신 내용을 확인하고 다시 저장해 주세요.',
        task.version,
      )
    return task
  }
  private list(state: WorkspaceState, id: string) {
    return (
      state.lists.find((list) => list.id === id && list.workspaceId === state.workspace.id) ??
      notFound()
    )
  }
  private section(state: WorkspaceState, listId: string, sectionId: string | null) {
    if (
      sectionId &&
      !state.sections.some(
        (section) =>
          section.id === sectionId &&
          section.listId === listId &&
          section.workspaceId === state.workspace.id,
      )
    )
      notFound()
  }
  private tags(state: WorkspaceState, tagIds: string[]) {
    if (
      new Set(tagIds).size !== tagIds.length ||
      tagIds.some(
        (id) => !state.tags.some((tag) => tag.id === id && tag.workspaceId === state.workspace.id),
      )
    )
      notFound()
  }
  private touch(task: Task) {
    task.version++
    task.updatedAt = this.now().toISOString()
    return structuredClone(task)
  }
  async workspace(actor: Actor): Promise<WorkspaceDTO> {
    const { receipts: _, ...state } = await this.repository.read(actor)
    return state
  }
  async getTask(actor: Actor, taskId: string) {
    const state = await this.repository.read(actor)
    return state.tasks.find((task) => task.id === taskId && !task.deletedAt) ?? notFound()
  }
  async listTasks(actor: Actor, input: z.infer<typeof listQuerySchema>) {
    const state = await this.repository.read(actor),
      zone = state.workspace.timeZone
    if (input.view === 'list' && input.listId) this.list(state, input.listId)
    const items = selectTasks(state, input.view, input.listId, this.now())
      .filter((task) => {
        if (input.filter?.tagId && !task.tagIds.includes(input.filter.tagId)) return false
        if (input.filter?.priority !== undefined && task.priority !== input.filter.priority)
          return false
        return (
          !input.filter?.query ||
          `${task.title} ${task.body}`
            .toLocaleLowerCase()
            .includes(input.filter.query.toLocaleLowerCase())
        )
      })
      .sort((a, b) => compareTasks(a, b, input.view === 'list' ? 'manual' : 'date', zone))
    const start = input.cursor ? items.findIndex((task) => task.id === input.cursor) + 1 : 0
    if (input.cursor && start === 0)
      throw new DomainError('INVALID_INPUT', '유효하지 않은 목록 커서입니다.')
    return {
      items: items.slice(start, start + input.limit),
      nextCursor: start + input.limit < items.length ? items[start + input.limit - 1].id : null,
    }
  }
  async getCalendar(actor: Actor, input: z.infer<typeof calendarQuerySchema>) {
    const state = await this.repository.read(actor)
    return state.tasks.filter(
      (task) =>
        !task.deletedAt && scheduleOverlaps(task.schedule, input.from, input.to, input.zoneId),
    )
  }
  createTask(actor: Actor, input: z.infer<typeof createTaskSchema>) {
    return this.mutate(actor, 'createTask', input, (state) => {
      this.list(state, input.listId)
      this.section(state, input.listId, input.sectionId ?? null)
      this.tags(state, input.tagIds)
      const timestamp = this.now().toISOString()
      const position =
        Math.max(
          0,
          ...state.tasks
            .filter(
              (task) =>
                task.listId === input.listId && task.sectionId === (input.sectionId ?? null),
            )
            .map((task) => task.position),
        ) + 1024
      const task: Task = {
        id: crypto.randomUUID(),
        workspaceId: state.workspace.id,
        listId: input.listId,
        sectionId: input.sectionId ?? null,
        title: input.title,
        body: '',
        status: 'open',
        priority: input.priority,
        position,
        version: 1,
        completedAt: null,
        deletedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        schedule: input.schedule,
        tagIds: input.tagIds,
      }
      state.tasks.push(task)
      return structuredClone(task)
    })
  }
  updateTask(actor: Actor, input: z.infer<typeof updateTaskSchema>) {
    return this.mutate(actor, 'updateTask', input, (state) => {
      const task = this.task(state, input)
      if (input.patch.tagIds) this.tags(state, input.patch.tagIds)
      Object.assign(task, input.patch as TaskPatch)
      return this.touch(task)
    })
  }
  moveTask(actor: Actor, input: z.infer<typeof moveTaskSchema>) {
    return this.mutate(actor, 'moveTask', input, (state) => {
      const task = this.task(state, input)
      this.list(state, input.listId)
      this.section(state, input.listId, input.sectionId)
      const siblings = state.tasks
        .filter(
          (other) =>
            other.id !== task.id &&
            !other.deletedAt &&
            other.listId === input.listId &&
            other.sectionId === input.sectionId,
        )
        .sort((a, b) => compareTasks(a, b))
      const anchorId = input.beforeId ?? input.afterId
      const index = anchorId
        ? siblings.findIndex((other) => other.id === anchorId)
        : siblings.length
      if (anchorId && index < 0) notFound()
      const target = input.afterId ? index + 1 : index
      let before = target > 0 ? siblings[target - 1].position : 0
      let after = target < siblings.length ? siblings[target].position : before + 2048
      if (after - before < 0.000001) {
        siblings.forEach((other, index) => {
          other.position = (index + 1) * 1024
          this.touch(other)
        })
        before = target > 0 ? siblings[target - 1].position : 0
        after = target < siblings.length ? siblings[target].position : before + 2048
      }
      task.listId = input.listId
      task.sectionId = input.sectionId
      task.position = (before + after) / 2
      return this.touch(task)
    })
  }
  completeTask(actor: Actor, input: Versioned) {
    return this.mutate(actor, 'completeTask', input, (state) => {
      const task = this.task(state, input)
      task.status = 'done'
      task.completedAt = this.now().toISOString()
      return this.touch(task)
    })
  }
  reopenTask(actor: Actor, input: Versioned) {
    return this.mutate(actor, 'reopenTask', input, (state) => {
      const task = this.task(state, input)
      task.status = 'open'
      task.completedAt = null
      return this.touch(task)
    })
  }
  trashTask(actor: Actor, input: Versioned) {
    return this.mutate(actor, 'trashTask', input, (state) => {
      const task = this.task(state, input)
      task.deletedAt = this.now().toISOString()
      return this.touch(task)
    })
  }
  restoreTask(actor: Actor, input: Versioned) {
    return this.mutate(actor, 'restoreTask', input, (state) => {
      const task = this.task(state, input, true)
      if (!state.lists.some((list) => list.id === task.listId)) {
        task.listId = state.lists.find((list) => list.kind === 'inbox')!.id
        task.sectionId = null
      }
      if (
        task.sectionId &&
        !state.sections.some(
          (section) => section.id === task.sectionId && section.listId === task.listId,
        )
      )
        task.sectionId = null
      task.deletedAt = null
      return this.touch(task)
    })
  }
  createList(actor: Actor, input: { requestId: string; name: string; color: string }) {
    return this.mutate(actor, 'createList', input, (state) => {
      const list = {
        id: crypto.randomUUID(),
        workspaceId: state.workspace.id,
        name: input.name,
        color: input.color,
        kind: 'list' as const,
        position: state.lists.length * 1024,
      }
      state.lists.push(list)
      return list
    })
  }
  createSection(actor: Actor, input: { requestId: string; listId: string; name: string }) {
    return this.mutate(actor, 'createSection', input, (state) => {
      const list = this.list(state, input.listId)
      if (list.kind === 'inbox')
        throw new DomainError('INVALID_INPUT', '일반 리스트에서 섹션을 추가해 주세요.')
      const section = {
        id: crypto.randomUUID(),
        workspaceId: state.workspace.id,
        listId: input.listId,
        name: input.name,
        position: state.sections.length * 1024,
      }
      state.sections.push(section)
      return section
    })
  }
  createTag(actor: Actor, input: { requestId: string; name: string; color: string }) {
    return this.mutate(actor, 'createTag', input, (state) => {
      const normalizedName = input.name.normalize('NFKC').toLocaleLowerCase()
      const existing = state.tags.find((tag) => tag.normalizedName === normalizedName)
      if (existing) return existing
      const tag = {
        id: crypto.randomUUID(),
        workspaceId: state.workspace.id,
        name: input.name,
        normalizedName,
        color: input.color,
      }
      state.tags.push(tag)
      return tag
    })
  }
  updateTimeZone(actor: Actor, input: { requestId: string; timeZone: string }) {
    return this.mutate(actor, 'updateTimeZone', input, (state) => {
      state.workspace.timeZone = input.timeZone
      return state.workspace
    })
  }
}
