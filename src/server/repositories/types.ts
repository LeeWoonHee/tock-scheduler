import type { WorkspaceState } from '@/features/tasks/types'

export type Actor = { id: string; name: string }
export interface WorkspaceRepository {
  read(actor: Actor): Promise<WorkspaceState>
  transaction<T>(actor: Actor, run: (state: WorkspaceState) => T | Promise<T>): Promise<T>
}
export function emptyWorkspace(actor: Actor): WorkspaceState {
  const workspaceId = crypto.randomUUID()
  return {
    workspace: {
      id: workspaceId,
      ownerId: actor.id,
      name: '나의 작업 공간',
      timeZone: 'Asia/Seoul',
    },
    lists: [
      {
        id: crypto.randomUUID(),
        workspaceId,
        name: 'Inbox',
        kind: 'inbox',
        color: '#002FA7',
        position: 0,
      },
    ],
    tasks: [],
    tags: [],
    sections: [],
    receipts: [],
  }
}
