import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/server/functions/tasks'
import type { Result, Task, WorkspaceDTO } from './types'
import { unwrap, ApiError, workspaceOptions } from './queries'

type Operation =
  'updateTask' | 'moveTask' | 'completeTask' | 'reopenTask' | 'trashTask' | 'restoreTask'
const queues = new Map<string, Promise<unknown>>()
function enqueue<T>(id: string, run: () => Promise<T>): Promise<T> {
  const previous = queues.get(id) ?? Promise.resolve()
  const next = previous.catch(() => {}).then(run)
  queues.set(id, next)
  void next
    .finally(() => {
      if (queues.get(id) === next) queues.delete(id)
    })
    .catch(() => {})
  return next
}
export function useTaskActions() {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['task-mutation'],
    retry: (count, error) => count < 1 && !(error instanceof ApiError),
    mutationFn: ({
      operation,
      task,
      extra = {},
      requestId,
    }: {
      operation: Operation
      task: Task
      extra?: Record<string, unknown>
      requestId: string
    }) =>
      enqueue(task.id, async () => {
        const result = (await api[operation]({
          data: { taskId: task.id, expectedVersion: task.version, requestId, ...extra },
        })) as Result<Task>
        return unwrap(result)
      }),
    onMutate: async ({ operation, task }) => {
      await client.cancelQueries(workspaceOptions)
      const previous = client
        .getQueryData(workspaceOptions.queryKey)
        ?.tasks.find((item) => item.id === task.id)
      const patch =
        operation === 'completeTask'
          ? { status: 'done' as const, completedAt: new Date().toISOString() }
          : operation === 'reopenTask'
            ? { status: 'open' as const, completedAt: null }
            : operation === 'trashTask'
              ? { deletedAt: new Date().toISOString() }
              : operation === 'restoreTask'
                ? { deletedAt: null }
                : null
      if (patch)
        client.setQueryData<WorkspaceDTO>(workspaceOptions.queryKey, (state) =>
          state
            ? {
                ...state,
                tasks: state.tasks.map((item) =>
                  item.id === task.id ? { ...item, ...patch } : item,
                ),
              }
            : state,
        )
      return { previous }
    },
    onSuccess: (task) =>
      client.setQueryData<WorkspaceDTO>(workspaceOptions.queryKey, (state) =>
        state
          ? { ...state, tasks: state.tasks.map((item) => (item.id === task.id ? task : item)) }
          : state,
      ),
    onError: (error, variables, context) => {
      if (context?.previous)
        client.setQueryData<WorkspaceDTO>(workspaceOptions.queryKey, (state) =>
          state
            ? {
                ...state,
                tasks: state.tasks.map((item) =>
                  item.id === variables.task.id ? context.previous! : item,
                ),
              }
            : state,
        )
      toast.error(error.message)
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED')
        window.location.assign('/login')
    },
    onSettled: (_data, _error, variables) =>
      Promise.all([
        client.invalidateQueries(workspaceOptions),
        client.invalidateQueries({ queryKey: ['task', variables.task.id] }),
      ]),
  })
  const run = (operation: Operation, task: Task, extra?: Record<string, unknown>) =>
    mutation.mutateAsync({ operation, task, extra, requestId: crypto.randomUUID() })
  async function toggle(task: Task) {
    try {
      const done = task.status === 'open',
        updated = await run(done ? 'completeTask' : 'reopenTask', task)
      if (done)
        toast.success('할 일을 완료했어요.', {
          action: {
            label: '되돌리기',
            onClick: () => {
              void run('reopenTask', updated).catch(() => {})
            },
          },
        })
    } catch {
      /* The mutation owns error feedback. */
    }
  }
  async function trash(task: Task) {
    try {
      const updated = await run('trashTask', task)
      toast('휴지통으로 이동했어요.', {
        action: {
          label: '되돌리기',
          onClick: () => {
            void run('restoreTask', updated).catch(() => {})
          },
        },
      })
      return true
    } catch {
      return false
    }
  }
  return { run, toggle, trash, pending: mutation.isPending }
}
