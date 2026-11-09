import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { fromCrossJSON, toJSON } from 'seroval'

// Exercise real Start handlers, cookies, validation and SSR without opening a port.
const directory = await mkdtemp(join(tmpdir(), 'dayflow-integration-'))
process.env.NODE_ENV = 'development'
process.env.APP_STORAGE = 'local'
process.env.LOCAL_DATA_FILE = join(directory, 'data.json')
const origin = 'http://localhost:3100'
const server = await createServer({
  server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  appType: 'custom',
  logLevel: 'silent',
})
let assertions = 0
function check(condition, message) {
  assert.ok(condition, message)
  assertions++
}
try {
  const runner = server.environments.ssr.runner
  const { default: app } = await runner.import('@tanstack/react-start/server-entry')
  const auth = await runner.import('/src/server/functions/auth.ts')
  const api = await runner.import('/src/server/functions/tasks.ts')
  const dates = await runner.import('/src/lib/dates.ts')
  let cookie = ''
  async function call(fn, data, method = 'POST', extraHeaders = {}) {
    const payload = JSON.stringify(toJSON({ data }))
    const url =
      origin + fn.url + (method === 'GET' ? '?payload=' + encodeURIComponent(payload) : '')
    const response = await app.fetch(
      new Request(url, {
        method,
        headers: {
          origin,
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
          'x-tsr-serverfn': 'true',
          ...(cookie ? { cookie } : {}),
          ...extraHeaders,
        },
        ...(method === 'POST' ? { body: payload } : {}),
      }),
    )
    if (response.headers.get('set-cookie'))
      cookie = response.headers.get('set-cookie').split(';')[0]
    const text = await response.text()
    let value
    if (response.ok && text) {
      const decoded = fromCrossJSON(JSON.parse(text), { refs: new Map() })
      if (decoded.error) throw decoded.error
      value = decoded.result
    }
    return { response, value }
  }
  const protectedPage = await app.fetch(new Request(origin + '/app/today'))
  check(
    protectedPage.status === 307 && protectedPage.headers.get('location')?.startsWith('/login'),
    'Unauthenticated page redirects',
  )
  const loginPage = await app.fetch(new Request(origin + '/login?redirect=%2Fapp%2Ftoday'))
  check(
    loginPage.status === 200 && (await loginPage.text()).includes('로컬에서 시작'),
    'Local login is rendered by SSR',
  )
  check(
    loginPage.headers.get('cache-control')?.includes('no-store'),
    'Login cannot be shared-cached',
  )
  const blocked = await call(auth.localLogin, undefined, 'POST', {
    origin: 'https://untrusted.example',
    'sec-fetch-site': 'cross-site',
  })
  check(blocked.response.status === 403, 'Cross-site mutations are rejected')
  const noSession = await call(api.getWorkspace, undefined, 'GET')
  check(noSession.value.error.code === 'UNAUTHENTICATED', 'Server function requires session')
  const signedIn = await call(auth.localLogin)
  check(
    signedIn.response.status === 200 && signedIn.value.ok && cookie.startsWith('dayflow.local='),
    'Local session cookie is issued',
  )
  check(/httponly/i.test(signedIn.response.headers.get('set-cookie')), 'Session is HttpOnly')
  check(/samesite=lax/i.test(signedIn.response.headers.get('set-cookie')), 'Session uses SameSite')
  const state = (await call(api.getWorkspace, undefined, 'GET')).value.data
  check(state.lists.length === 1 && state.lists[0].kind === 'inbox', 'Inbox is provisioned')
  const today = dates.dateInZone(new Date(), 'Asia/Seoul')
  const input = {
    title: '통합 검증 작업',
    listId: state.lists[0].id,
    requestId: crypto.randomUUID(),
  }
  const created = (await call(api.createTask, input)).value.data
  const replay = (await call(api.createTask, input)).value.data
  check(created.id === replay.id, 'Retry preserves task identity')
  const setToday = (
    await call(api.updateTask, {
      taskId: created.id,
      expectedVersion: 1,
      patch: { schedule: dates.allDay(today) },
      requestId: crypto.randomUUID(),
    })
  ).value.data
  const todayList = (await call(api.listTasks, { view: 'today' }, 'GET')).value.data
  check(
    todayList.items.some((task) => task.id === created.id),
    'Scheduled task appears in Today',
  )
  const calendar = (
    await call(
      api.getCalendar,
      { from: today, to: dates.addDays(today, 1), zoneId: 'Asia/Seoul' },
      'GET',
    )
  ).value.data
  check(
    calendar.some((task) => task.id === created.id),
    'Calendar uses the same task',
  )
  const conflict = await call(api.updateTask, {
    taskId: created.id,
    expectedVersion: 1,
    patch: { title: '충돌' },
    requestId: crypto.randomUUID(),
  })
  check(conflict.value.error.code === 'VERSION_CONFLICT', 'Stale update fails with conflict')
  const htmlResponse = await app.fetch(
    new Request(origin + '/app/today', { headers: { cookie, accept: 'text/html' } }),
  )
  const html = await htmlResponse.text()
  check(
    htmlResponse.status === 200 && html.includes('통합 검증 작업') && html.includes('작업 공간'),
    'Authenticated page is rendered with real stored data',
  )
  check(
    htmlResponse.headers.get('cache-control')?.includes('no-store'),
    'Private SSR is not shared-cached',
  )
  const moveDate = (
    await call(api.updateTask, {
      taskId: created.id,
      expectedVersion: setToday.version,
      patch: { schedule: dates.allDay(dates.addDays(today, 1)) },
      requestId: crypto.randomUUID(),
    })
  ).value.data
  check(
    (await call(api.listTasks, { view: 'today' }, 'GET')).value.data.items.length === 0,
    'Date move removes task from Today',
  )
  check(
    (await call(api.listTasks, { view: 'upcoming' }, 'GET')).value.data.items[0].id === created.id,
    'Date move updates Upcoming',
  )
  const completed = (
    await call(api.completeTask, {
      taskId: created.id,
      expectedVersion: moveDate.version,
      requestId: crypto.randomUUID(),
    })
  ).value.data
  check(completed.status === 'done' && completed.completedAt, 'Completion records timestamp')
  const reopened = (
    await call(api.reopenTask, {
      taskId: created.id,
      expectedVersion: completed.version,
      requestId: crypto.randomUUID(),
    })
  ).value.data
  check(reopened.status === 'open' && reopened.completedAt === null, 'Undo reopens task')
  const trashed = (
    await call(api.trashTask, {
      taskId: created.id,
      expectedVersion: reopened.version,
      requestId: crypto.randomUUID(),
    })
  ).value.data
  check(
    (await call(api.listTasks, { view: 'inbox' }, 'GET')).value.data.items.length === 0,
    'Trash hides task',
  )
  const restored = (
    await call(api.restoreTask, {
      taskId: created.id,
      expectedVersion: trashed.version,
      requestId: crypto.randomUUID(),
    })
  ).value.data
  check(restored.id === created.id && restored.deletedAt === null, 'Restore preserves identity')
  const unknown = await call(api.getTask, crypto.randomUUID(), 'GET')
  check(unknown.value.error.code === 'NOT_FOUND', 'Unknown IDs reveal no data')
  const invalid = await call(api.createTask, {
    ...input,
    requestId: crypto.randomUUID(),
    workspaceId: 'foreign',
  })
  check(invalid.value.error.code === 'INVALID_INPUT', 'Caller cannot inject a workspace ID')
  const invalidRange = await call(
    api.getCalendar,
    { from: '2026-01-01', to: '2026-04-01', zoneId: 'UTC' },
    'GET',
  )
  check(invalidRange.value.error.code === 'INVALID_INPUT', 'Calendar is bounded to 62 days')
  const freshState = (await call(api.getWorkspace, undefined, 'GET')).value.data
  check(
    freshState.tasks.length === 1 && freshState.tasks[0].version === restored.version,
    'Reload retains committed version',
  )
  await call(auth.localLogout)
  check(
    (await call(api.getWorkspace, undefined, 'GET')).value.error.code === 'UNAUTHENTICATED',
    'Logout revokes access',
  )
  console.log(
    `Integration: ${assertions} assertions passed (real SSR, server functions, CSRF and local storage).`,
  )
} finally {
  await server.close()
  await rm(directory, { recursive: true, force: true })
}
