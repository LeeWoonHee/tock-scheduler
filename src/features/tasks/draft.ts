import type { Task, TaskPatch } from './types'

/** Only include fields actually edited, preserving independent edits in another tab. */
export function draftPatch(draft: Task, baseline: Task): TaskPatch {
  const patch: TaskPatch = {}
  if (draft.title !== baseline.title) patch.title = draft.title
  if (draft.body !== baseline.body) patch.body = draft.body
  if (draft.priority !== baseline.priority) patch.priority = draft.priority
  if (JSON.stringify(draft.schedule) !== JSON.stringify(baseline.schedule))
    patch.schedule = draft.schedule
  if (JSON.stringify(draft.tagIds) !== JSON.stringify(baseline.tagIds)) patch.tagIds = draft.tagIds
  return patch
}
