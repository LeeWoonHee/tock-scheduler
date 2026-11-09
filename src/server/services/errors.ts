import type { AppErrorCode } from '@/features/tasks/types'

export class DomainError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public currentVersion?: number,
  ) {
    super(message)
  }
}
export function notFound(): never {
  throw new DomainError('NOT_FOUND', '항목을 찾을 수 없거나 접근할 수 없습니다.')
}
