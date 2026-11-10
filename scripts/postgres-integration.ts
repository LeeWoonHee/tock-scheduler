import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { mock } from 'bun:test'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import * as inputs from '../src/features/tasks/schemas'
import { allDay } from '../src/lib/dates'
import { TaskService } from '../src/server/services/task.service'

// This runs in its own process. Replace only the DB transport, keeping the real
// PostgreSQL SQL, migrations, repository, constraints and service unchanged.
// No production credentials, external network or persistent DB is used.
const client = new PGlite()
const db = drizzle(client, { schema })
mock.module('../src/db/client.server', () => ({
  withDatabase: <T>(run: (database: typeof db) => Promise<T>) => run(db),
}))

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions++
}
const alice = { id: 'google-user-alice', name: '테스트 A' }
const bob = { id: 'google-user-bob', name: '테스트 B' }
const requestId = () => crypto.randomUUID()
const versioned = (task: { id: string; version: number }) => ({
  taskId: task.id,
  expectedVersion: task.version,
  requestId: requestId(),
})

try {
  await migrate(db, { migrationsFolder: resolve('drizzle') })
  await migrate(db, { migrationsFolder: resolve('drizzle') })
  check(true, 'The real migration applies and is not reapplied on a second run')
  // Model the records already created by OAuth. Google itself is not mocked
  // as a successful login; authentication is outside this SQL integration test.
  await db.insert(schema.user).values(
    [alice, bob].map((actor) => ({
      ...actor,
      email: `${actor.id}@example.invalid`,
      emailVerified: true,
    })),
  )
  const { PostgresRepository } = await import('../src/server/repositories/postgres.server')
  const service = new TaskService(new PostgresRepository())
  const initial = await service.workspace(alice)
  check(
    initial.workspace.ownerId === alice.id,
    'First authenticated load creates an owned workspace',
  )
  check(
    initial.lists.length === 1 && initial.lists[0]!.kind === 'inbox',
    'First load creates one Inbox',
  )
  const reloads = await Promise.all(Array.from({ length: 5 }, () => service.workspace(alice)))
  check(
    reloads.every((state) => state.workspace.id === initial.workspace.id),
    'Repeated loads keep the same workspace',
  )
  check(
    reloads.every((state) => state.lists.length === 1),
    'Repeated loads keep exactly one Inbox',
  )
  const members = await db.select().from(schema.workspaceMembers)
  check(
    members.length === 1 && members[0]!.userId === alice.id,
    'Owner membership is provisioned once',
  )
  const foreign = await service.workspace(bob)
  check(foreign.workspace.id !== initial.workspace.id, 'Each user has a separate workspace')
  const create = inputs.createTaskSchema.parse({
    requestId: requestId(),
    title: 'PostgreSQL 통합 검증',
    listId: initial.lists[0]!.id,
    schedule: allDay('2026-11-10'),
  })
  const task = await service.createTask(alice, create)
  check(task.version === 1, 'Task is committed in a real PostgreSQL transaction')
  const replay = await service.createTask(alice, create)
  check(replay.id === task.id, 'Mutation receipt makes retries idempotent')
  const fetched = await service.getTask(alice, task.id)
  check(
    fetched.schedule?.kind === 'allDay' && fetched.schedule.startDate === '2026-11-10',
    'Date schedules survive SQL round trips',
  )
  await assert.rejects(() => service.getTask(bob, task.id), { code: 'NOT_FOUND' })
  assertions++
  const tag = await service.createTag(alice, {
    requestId: requestId(),
    name: '검증',
    color: '#002FA7',
  })
  const updated = await service.updateTask(alice, {
    ...versioned(task),
    patch: {
      tagIds: [tag.id],
      schedule: {
        kind: 'timed',
        startAt: '2026-11-10T03:00:00Z',
        endAt: null,
        zoneId: 'Asia/Seoul',
      },
    },
  })
  const timed = await service.getTask(alice, task.id)
  check(
    timed.tagIds[0] === tag.id && timed.schedule?.kind === 'timed',
    'Tags and timed schedules survive SQL round trips',
  )
  check(
    timed.schedule?.kind === 'timed' &&
      Date.parse(timed.schedule.startAt) === Date.parse('2026-11-10T03:00:00Z'),
    'Timestamp decoding preserves the instant',
  )
  await assert.rejects(
    () => service.updateTask(alice, { ...versioned(task), patch: { title: 'stale' } }),
    { code: 'VERSION_CONFLICT' },
  )
  assertions++
  const list = await service.createList(alice, {
    requestId: requestId(),
    name: '프로젝트',
    color: '#002FA7',
  })
  const section = await service.createSection(alice, {
    requestId: requestId(),
    listId: list.id,
    name: '진행',
  })
  const moved = await service.moveTask(alice, {
    ...versioned(updated),
    listId: list.id,
    sectionId: section.id,
  })
  check(
    (await service.getTask(alice, task.id)).sectionId === section.id,
    'Moving into a section respects composite foreign keys',
  )
  const done = await service.completeTask(alice, versioned(moved))
  check(
    done.status === 'done' && Boolean(done.completedAt),
    'Completion satisfies the database timestamp constraint',
  )
  const reopened = await service.reopenTask(alice, versioned(done))
  check(
    reopened.status === 'open' && reopened.completedAt === null,
    'Reopening clears the completion timestamp',
  )
  const trashed = await service.trashTask(alice, versioned(reopened))
  check(Boolean(trashed.deletedAt), 'Trash timestamp is persisted')
  const restored = await service.restoreTask(alice, versioned(trashed))
  check(restored.id === task.id && restored.deletedAt === null, 'Restore preserves task identity')
  const state = await new TaskService(new PostgresRepository()).workspace(alice)
  check(
    state.tasks.length === 1 && state.tasks[0]!.version === restored.version,
    'New repository reads the committed workspace',
  )
  const duplicates = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerId, alice.id))
  check(duplicates.length === 1, 'All read and write operations preserve one personal workspace')
  console.log(
    `PostgreSQL integration: ${assertions} assertions passed (real migrations, PostgreSQL engine, repository, transactions and constraints; OAuth/network excluded).`,
  )
} finally {
  await client.close()
}
