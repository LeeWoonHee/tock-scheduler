import { and, eq, inArray, lt } from 'drizzle-orm'
import { withDatabase, type Database } from '@/db/client.server'
import * as s from '@/db/schema'
import type { WorkspaceState, Task } from '@/features/tasks/types'
import { emptyWorkspace, type Actor, type WorkspaceRepository } from './types'
import { notFound } from '../services/errors'

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

export class PostgresRepository implements WorkspaceRepository {
  private async load(tx: Transaction, actor: Actor): Promise<WorkspaceState> {
    const initial = emptyWorkspace(actor)
    await tx
      .insert(s.workspaces)
      .values(initial.workspace)
      .onConflictDoNothing({ target: s.workspaces.ownerId })
    const [workspace] = await tx
      .select()
      .from(s.workspaces)
      .where(eq(s.workspaces.ownerId, actor.id))
      .for('update')
    if (!workspace) return notFound()
    await tx
      .insert(s.workspaceMembers)
      .values({ workspaceId: workspace.id, userId: actor.id, role: 'owner' })
      .onConflictDoNothing()
    const [membership] = await tx
      .select()
      .from(s.workspaceMembers)
      .where(
        and(
          eq(s.workspaceMembers.workspaceId, workspace.id),
          eq(s.workspaceMembers.userId, actor.id),
        ),
      )
    if (!membership) return notFound()
    await tx
      .insert(s.lists)
      .values({ ...initial.lists[0], workspaceId: workspace.id })
      .onConflictDoNothing()
    const lists = await tx.select().from(s.lists).where(eq(s.lists.workspaceId, workspace.id))
    const sections = await tx
      .select()
      .from(s.sections)
      .where(eq(s.sections.workspaceId, workspace.id))
    const tags = await tx.select().from(s.tags).where(eq(s.tags.workspaceId, workspace.id))
    const rows = await tx.select().from(s.tasks).where(eq(s.tasks.workspaceId, workspace.id))
    const schedules = rows.length
      ? await tx
          .select()
          .from(s.taskSchedules)
          .where(
            inArray(
              s.taskSchedules.taskId,
              rows.map((row) => row.id),
            ),
          )
      : []
    const links = await tx.select().from(s.taskTags).where(eq(s.taskTags.workspaceId, workspace.id))
    const receipts = await tx
      .select()
      .from(s.mutationReceipts)
      .where(eq(s.mutationReceipts.workspaceId, workspace.id))
    const tasks: Task[] = rows.map((row) => {
      const schedule = schedules.find((schedule) => schedule.taskId === row.id)
      return {
        ...row,
        tagIds: links.filter((link) => link.taskId === row.id).map((link) => link.tagId),
        schedule: !schedule
          ? null
          : schedule.kind === 'allDay'
            ? {
                kind: 'allDay',
                startDate: schedule.startDate!,
                endDateExclusive: schedule.endDateExclusive!,
              }
            : {
                kind: 'timed',
                startAt: schedule.startAt!,
                endAt: schedule.endAt,
                zoneId: schedule.zoneId!,
              },
      }
    })
    return { workspace, lists, sections, tags, tasks, receipts }
  }
  private async save(tx: Transaction, state: WorkspaceState) {
    await tx
      .update(s.workspaces)
      .set({ timeZone: state.workspace.timeZone })
      .where(eq(s.workspaces.id, state.workspace.id))
    for (const list of state.lists)
      await tx
        .insert(s.lists)
        .values(list)
        .onConflictDoUpdate({
          target: s.lists.id,
          set: { name: list.name, color: list.color, position: list.position },
        })
    for (const section of state.sections)
      await tx
        .insert(s.sections)
        .values(section)
        .onConflictDoUpdate({
          target: s.sections.id,
          set: { name: section.name, position: section.position },
        })
    for (const tag of state.tags) await tx.insert(s.tags).values(tag).onConflictDoNothing()
    for (const task of state.tasks) {
      const { schedule, tagIds, ...row } = task
      await tx.insert(s.tasks).values(row).onConflictDoUpdate({ target: s.tasks.id, set: row })
      await tx.delete(s.taskSchedules).where(eq(s.taskSchedules.taskId, task.id))
      if (schedule) await tx.insert(s.taskSchedules).values({ taskId: task.id, ...schedule })
      await tx
        .delete(s.taskTags)
        .where(and(eq(s.taskTags.taskId, task.id), eq(s.taskTags.workspaceId, state.workspace.id)))
      if (tagIds.length)
        await tx
          .insert(s.taskTags)
          .values(
            tagIds.map((tagId) => ({ taskId: task.id, tagId, workspaceId: state.workspace.id })),
          )
    }
    await tx
      .delete(s.mutationReceipts)
      .where(
        and(
          eq(s.mutationReceipts.workspaceId, state.workspace.id),
          lt(s.mutationReceipts.expiresAt, new Date().toISOString()),
        ),
      )
    for (const receipt of state.receipts)
      await tx
        .insert(s.mutationReceipts)
        .values({ ...receipt, workspaceId: state.workspace.id })
        .onConflictDoNothing()
  }
  read(actor: Actor) {
    return withDatabase((db) => db.transaction((tx) => this.load(tx, actor)))
  }
  transaction<T>(actor: Actor, run: (state: WorkspaceState) => T | Promise<T>): Promise<T> {
    return withDatabase((db) =>
      db.transaction(async (tx) => {
        const state = await this.load(tx, actor)
        const response = await run(state)
        await this.save(tx, state)
        return response
      }),
    )
  }
}
