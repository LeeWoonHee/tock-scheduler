export type Schedule =
  | { kind: 'allDay'; startDate: string; endDateExclusive: string }
  | { kind: 'timed'; startAt: string; endAt: string | null; zoneId: string }

export type Task = {
  id: string
  workspaceId: string
  listId: string
  sectionId: string | null
  title: string
  body: string
  status: 'open' | 'done'
  priority: 0 | 1 | 2 | 3
  position: number
  version: number
  completedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  schedule: Schedule | null
  tagIds: string[]
}
export type TaskList = {
  id: string
  workspaceId: string
  name: string
  kind: 'inbox' | 'list'
  color: string
  position: number
}
export type Section = {
  id: string
  workspaceId: string
  listId: string
  name: string
  position: number
}
export type Tag = {
  id: string
  workspaceId: string
  name: string
  normalizedName: string
  color: string
}
export type Workspace = { id: string; ownerId: string; name: string; timeZone: string }
export type MutationReceipt = {
  actorId: string
  operation: string
  requestId: string
  inputHash: string
  response: unknown
  expiresAt: string
}
export type WorkspaceState = {
  workspace: Workspace
  lists: TaskList[]
  sections: Section[]
  tags: Tag[]
  tasks: Task[]
  receipts: MutationReceipt[]
}
export type WorkspaceDTO = Omit<WorkspaceState, 'receipts'>
export type SessionDTO = {
  user: { id: string; name: string; email: string }
  mode: 'local' | 'postgres'
}
export type View = 'inbox' | 'today' | 'upcoming' | 'list' | 'calendar' | 'trash'
export type AppErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'REQUEST_ID_REUSED'
  | 'TEMPORARY_FAILURE'
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AppErrorCode; message: string; currentVersion?: number } }
export type TaskPatch = Partial<Pick<Task, 'title' | 'body' | 'priority' | 'schedule' | 'tagIds'>>
