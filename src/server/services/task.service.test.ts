import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TaskService } from './task.service'
import { LocalRepository } from '../repositories/local.server'
import {
  createTaskSchema,
  listQuerySchema,
  moveTaskSchema,
  updateTaskSchema,
} from '@/features/tasks/schemas'
import { allDay } from '@/lib/dates'
import { draftPatch } from '@/features/tasks/draft'

const alice = { id: 'alice', name: '사용자 A' },
  bob = { id: 'bob', name: '사용자 B' }
let directory: string, service: TaskService
const requestId = () => crypto.randomUUID()
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'dayflow-test-'))
  service = new TaskService(
    new LocalRepository(join(directory, 'tasks.json')),
    () => new Date('2026-11-09T03:00:00Z'),
  )
})
afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})
async function makeTask(
  title = '첫 번째 할 일',
  schedule: ReturnType<typeof allDay> | null = null,
) {
  const state = await service.workspace(alice)
  return service.createTask(
    alice,
    createTaskSchema.parse({ requestId: requestId(), title, listId: state.lists[0].id, schedule }),
  )
}
const versioned = (task: { id: string; version: number }) => ({
  taskId: task.id,
  expectedVersion: task.version,
  requestId: requestId(),
})

describe('할 일의 저장 및 권한', () => {
  test('동시 가입 초기화에서도 개인 Inbox는 하나다', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => service.workspace(alice)))
    expect(new Set(results.map((state) => state.workspace.id)).size).toBe(1)
    expect((await service.workspace(alice)).lists).toHaveLength(1)
  })
  test('같은 requestId의 생성 재시도는 같은 할 일을 반환한다', async () => {
    const state = await service.workspace(alice)
    const input = createTaskSchema.parse({
      requestId: requestId(),
      title: '재시도 테스트',
      listId: state.lists[0].id,
    })
    const [first, second] = await Promise.all([
      service.createTask(alice, input),
      service.createTask(alice, input),
    ])
    expect(first.id).toBe(second.id)
    expect((await service.workspace(alice)).tasks).toHaveLength(1)
    await expect(service.createTask(alice, { ...input, title: '다른 내용' })).rejects.toMatchObject(
      { code: 'REQUEST_ID_REUSED' },
    )
  })
  test('다른 사용자의 할 일 ID와 목적지에 접근할 수 없다', async () => {
    const task = await makeTask(),
      foreign = await service.workspace(bob)
    await expect(service.getTask(bob, task.id)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      service.moveTask(
        alice,
        moveTaskSchema.parse({ ...versioned(task), listId: foreign.lists[0].id }),
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect((await service.workspace(bob)).tasks).toHaveLength(0)
  })
  test('다른 리스트의 섹션과 다른 워크스페이스 태그를 거절한다', async () => {
    const task = await makeTask()
    const list = await service.createList(alice, {
      requestId: requestId(),
      name: '프로젝트',
      color: '#002FA7',
    })
    const section = await service.createSection(alice, {
      requestId: requestId(),
      listId: list.id,
      name: '진행 중',
    })
    await expect(
      service.moveTask(
        alice,
        moveTaskSchema.parse({ ...versioned(task), listId: task.listId, sectionId: section.id }),
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    const tag = await service.createTag(bob, {
      requestId: requestId(),
      name: '비공개',
      color: '#002FA7',
    })
    await expect(
      service.updateTask(
        alice,
        updateTaskSchema.parse({ ...versioned(task), patch: { tagIds: [tag.id] } }),
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
  test('두 창의 동시 변경 중 하나만 성공한다', async () => {
    const task = await makeTask()
    const results = await Promise.allSettled(
      ['창 A', '창 B'].map((title) =>
        service.updateTask(alice, updateTaskSchema.parse({ ...versioned(task), patch: { title } })),
      ),
    )
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    expect(rejected.reason).toMatchObject({ code: 'VERSION_CONFLICT', currentVersion: 2 })
  })
  test('생략한 필드는 보존하고 schedule=null은 일정을 제거한다', async () => {
    const task = await makeTask('일정 있는 일', allDay('2026-11-09'))
    const updated = await service.updateTask(
      alice,
      updateTaskSchema.parse({ ...versioned(task), patch: { body: '보존할 본문', priority: 3 } }),
    )
    expect(updated.schedule).toEqual(task.schedule)
    const cleared = await service.updateTask(
      alice,
      updateTaskSchema.parse({ ...versioned(updated), patch: { schedule: null } }),
    )
    expect(cleared.schedule).toBeNull()
    expect(cleared.body).toBe('보존할 본문')
    expect(cleared.priority).toBe(3)
  })
  test('완료와 되돌리기는 완료 시각과 버전을 함께 갱신한다', async () => {
    const task = await makeTask(),
      input = versioned(task)
    const done = await service.completeTask(alice, input)
    expect(done.status).toBe('done')
    expect(done.completedAt).toBe('2026-11-09T03:00:00.000Z')
    expect(done.version).toBe(2)
    expect(await service.completeTask(alice, input)).toEqual(done)
    const reopened = await service.reopenTask(alice, versioned(done))
    expect(reopened.status).toBe('open')
    expect(reopened.completedAt).toBeNull()
    expect(reopened.version).toBe(3)
  })
  test('삭제는 기본 조회에서 숨기고 복원은 같은 ID를 유지한다', async () => {
    const task = await makeTask(),
      trashed = await service.trashTask(alice, versioned(task))
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'inbox' }))).items,
    ).toHaveLength(0)
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'trash' }))).items[0].id,
    ).toBe(task.id)
    const restored = await service.restoreTask(alice, versioned(trashed))
    expect(restored.id).toBe(task.id)
    expect(restored.deletedAt).toBeNull()
  })
  test('원래 리스트가 사라졌다면 Inbox로 복원한다', async () => {
    const repo = new LocalRepository(join(directory, 'restore.json')),
      other = new TaskService(repo)
    const state = await other.workspace(alice),
      list = await other.createList(alice, {
        requestId: requestId(),
        name: '임시',
        color: '#002FA7',
      })
    const task = await other.createTask(
      alice,
      createTaskSchema.parse({ requestId: requestId(), title: '복원', listId: list.id }),
    )
    const trashed = await other.trashTask(alice, versioned(task))
    await repo.transaction(alice, (state) => {
      state.lists = state.lists.filter((item) => item.id !== list.id)
    })
    expect((await other.restoreTask(alice, versioned(trashed))).listId).toBe(state.lists[0].id)
  })
  test('리스트 수동 이동은 앞뒤 항목 사이의 위치를 계산한다', async () => {
    const first = await makeTask('첫째'),
      second = await makeTask('둘째'),
      third = await makeTask('셋째')
    const moved = await service.moveTask(
      alice,
      moveTaskSchema.parse({ ...versioned(third), listId: first.listId, beforeId: second.id }),
    )
    expect(moved.position).toBeGreaterThan(first.position)
    expect(moved.position).toBeLessThan(second.position)
  })
  test('대소문자와 유니코드 정규화를 거친 같은 태그는 하나다', async () => {
    const first = await service.createTag(alice, {
      requestId: requestId(),
      name: 'Work',
      color: '#002FA7',
    })
    const second = await service.createTag(alice, {
      requestId: requestId(),
      name: 'ＷＯＲＫ',
      color: '#002FA7',
    })
    expect(first.id).toBe(second.id)
  })
})
describe('목록 간 동일성', () => {
  test('Inbox에서 생성한 오늘 할 일은 오늘과 달력에서 같은 ID로 보인다', async () => {
    const task = await makeTask('회의 안건 정리', allDay('2026-11-09'))
    const today = await service.listTasks(alice, listQuerySchema.parse({ view: 'today' }))
    const calendar = await service.getCalendar(alice, {
      from: '2026-11-01',
      to: '2026-12-01',
      zoneId: 'Asia/Seoul',
    })
    expect(today.items[0].id).toBe(task.id)
    expect(calendar[0].id).toBe(task.id)
    const moved = await service.updateTask(
      alice,
      updateTaskSchema.parse({ ...versioned(task), patch: { schedule: allDay('2026-11-10') } }),
    )
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'today' }))).items,
    ).toHaveLength(0)
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'upcoming' }))).items[0].id,
    ).toBe(moved.id)
  })
  test('오늘은 기한 초과와 오늘 완료 항목을 포함하고 다가오는 일정은 내일부터 7일이다', async () => {
    await makeTask('기한 초과', allDay('2026-11-08'))
    const today = await makeTask('오늘', allDay('2026-11-09'))
    await service.completeTask(alice, versioned(today))
    await makeTask('마지막 포함일', allDay('2026-11-16'))
    await makeTask('범위 밖', allDay('2026-11-17'))
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'today' }))).items
        .map((task) => task.title)
        .sort(),
    ).toEqual(['기한 초과', '오늘'])
    expect(
      (await service.listTasks(alice, listQuerySchema.parse({ view: 'upcoming' }))).items.map(
        (task) => task.title,
      ),
    ).toEqual(['마지막 포함일'])
  })
  test('커서 페이지는 같은 항목을 중복 반환하지 않는다', async () => {
    await makeTask('1')
    await makeTask('2')
    await makeTask('3')
    const first = await service.listTasks(alice, listQuerySchema.parse({ view: 'inbox', limit: 2 }))
    const second = await service.listTasks(
      alice,
      listQuerySchema.parse({ view: 'inbox', limit: 2, cursor: first.nextCursor }),
    )
    expect(first.items).toHaveLength(2)
    expect(second.items).toHaveLength(1)
    expect(second.nextCursor).toBeNull()
    expect(new Set([...first.items, ...second.items].map((task) => task.id)).size).toBe(3)
  })
  test('재시작한 저장소에서도 동일한 데이터가 유지된다', async () => {
    const task = await makeTask('새로고침 후 유지')
    const restarted = new TaskService(new LocalRepository(join(directory, 'tasks.json')))
    expect((await restarted.getTask(alice, task.id)).title).toBe('새로고침 후 유지')
  })
  test('충돌 이후 재적용할 초안에는 사용자가 바꾼 필드만 포함한다', async () => {
    const task = await makeTask()
    expect(draftPatch({ ...task, body: '내 메모' }, task)).toEqual({ body: '내 메모' })
    expect(draftPatch(task, task)).toEqual({})
    expect(draftPatch({ ...task, schedule: allDay('2026-11-10') }, task)).toEqual({
      schedule: allDay('2026-11-10'),
    })
  })
})
