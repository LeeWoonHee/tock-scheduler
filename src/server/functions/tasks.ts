import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as schemas from '@/features/tasks/schemas'
import { requireActor } from '../auth/auth.server'
import { taskService } from '../services/index.server'
import { execute } from './execute.server'

// Parse inside the handler so validation failures use the same public error contract.
const identity = (value: unknown) => value
export const getWorkspace = createServerFn({ method: 'GET' }).handler(() =>
  execute('workspace.load', async () => taskService().workspace(await requireActor())),
)
export const listTasks = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute('tasks.list', async () =>
      taskService().listTasks(await requireActor(), schemas.listQuerySchema.parse(data)),
    ),
  )
export const getTask = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.get', async () =>
      taskService().getTask(await requireActor(), schemas.idSchema.parse(data)),
    ),
  )
export const getCalendar = createServerFn({ method: 'GET' })
  .validator(identity)
  .handler(({ data }) =>
    execute('calendar.get', async () =>
      taskService().getCalendar(await requireActor(), schemas.calendarQuerySchema.parse(data)),
    ),
  )
export const createTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.create', async () =>
      taskService().createTask(await requireActor(), schemas.createTaskSchema.parse(data)),
    ),
  )
export const updateTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.update', async () =>
      taskService().updateTask(await requireActor(), schemas.updateTaskSchema.parse(data)),
    ),
  )
export const moveTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.move', async () =>
      taskService().moveTask(await requireActor(), schemas.moveTaskSchema.parse(data)),
    ),
  )
export const completeTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.complete', async () =>
      taskService().completeTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const reopenTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.reopen', async () =>
      taskService().reopenTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const trashTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.trash', async () =>
      taskService().trashTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const restoreTask = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('task.restore', async () =>
      taskService().restoreTask(await requireActor(), schemas.versionedSchema.parse(data)),
    ),
  )
export const createList = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('list.create', async () =>
      taskService().createList(await requireActor(), schemas.createListSchema.parse(data)),
    ),
  )
export const createSection = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('section.create', async () =>
      taskService().createSection(await requireActor(), schemas.createSectionSchema.parse(data)),
    ),
  )
export const createTag = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('tag.create', async () =>
      taskService().createTag(await requireActor(), schemas.createTagSchema.parse(data)),
    ),
  )
export const updateTimeZone = createServerFn({ method: 'POST' })
  .validator(identity)
  .handler(({ data }) =>
    execute('workspace.timeZone.update', async () =>
      taskService().updateTimeZone(
        await requireActor(),
        z
          .object({ requestId: z.string().uuid(), timeZone: schemas.zoneSchema })
          .strict()
          .parse(data),
      ),
    ),
  )
