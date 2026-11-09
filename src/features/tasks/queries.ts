import { queryOptions } from '@tanstack/react-query'
import { getWorkspace } from '@/server/functions/tasks'
import type { Result } from './types'

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public currentVersion?: number,
  ) {
    super(message)
  }
}
export function unwrap<T>(result: Result<T>): T {
  if (!result.ok)
    throw new ApiError(result.error.code, result.error.message, result.error.currentVersion)
  return result.data
}
export const workspaceOptions = queryOptions({
  queryKey: ['workspace'],
  queryFn: async () => unwrap(await getWorkspace()),
  staleTime: 15000,
  refetchOnWindowFocus: true,
  refetchInterval: 30000,
  retry: 1,
})
