import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as schemas from '@/features/tasks/schemas'
import type { Result } from '@/features/tasks/types'
import { requireActor } from '../auth/auth.server'
import { taskService } from '../services/index.server'
import { DomainError } from '../services/errors'

async function execute<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    if (error instanceof DomainError)
      return {
        ok: false,
        error: { code: error.code, message: error.message, currentVersion: error.currentVersion },
      }
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.issues[0]?.message ?? '입력을 확인해 주세요.',
        },
      }
    console.error(JSON.stringify({ requestId: crypto.randomUUID(), code: 'TEMPORARY_FAILURE' }))
    return {
      ok: false,
      error: {
        code: 'TEMPORARY_FAILURE',
        message: '저장하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.',
      },
    }
  }
}
// Parse inside the handler so validation failures use the same public error contract.
const identity = (value: unknown) => value
export const getWorkspace = createServerFn({ method: 'GET' }).handler(() =>
  execute(async () => taskService().workspace(await requireActor())),
)
export const listTasks = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().listTasks(await requireActor(), schemas.listQuerySchema.parse(data)),
    ),
  )
export const getTask = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () => taskService().getTask(await requireActor(), schemas.idSchema.parse(data))),
  )
export const getCalendar = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().getCalendar(await requireActor(), schemas.calendarQuerySchema.parse(data)),
    ),
  )
export const createTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().createTask(await requireActor(), schemas.createTaskSchema.parse(data)),
    ),
  )
export const updateTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().updateTask(await requireActor(), schemas.updateTaskSchema.parse(data)),
    ),
  )
export const moveTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().moveTask(await requireActor(), schemas.moveTaskSchema.parse(data)),
    ),
  )
export const completeTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().completeTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const reopenTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().reopenTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const trashTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().trashTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const restoreTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().restoreTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const createList = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().createList(await requireActor(), schemas.createListSchema.parse(data)),
    ),
  )
export const createSection = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().createSection(await requireActor(), schemas.createSectionSchema.parse(data)),
    ),
  )
export const createTag = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().createTag(await requireActor(), schemas.createTagSchema.parse(data)),
    ),
  )
export const updateTimeZone = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute(async () =>
      taskService().updateTimeZone(
        await requireActor(),
        z
          .object({ requestId: z.string().uuid(), timeZone: schemas.zoneSchema })
          .strict()
          .parse(data),
      ),
    ),
  )
