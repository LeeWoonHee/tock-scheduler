import { z } from 'zod'
import type { Result } from '@/features/tasks/types'
import { describeAuthFailure } from '../auth/failure.server'
import { DomainError } from '../services/errors'

export async function execute<T>(operation: string, run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    if (error instanceof DomainError)
      return {
        ok: false,
        error: { code: error.code, message: error.message, currentVersion: error.currentVersion },
      }
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.issues[0]?.message ?? '입력을 확인해 주세요.',
        },
      }
    const { driverCodes, errorNames, tables } = describeAuthFailure(error)
    console.error('[dayflow:tasks] Operation failed', {
      requestId: crypto.randomUUID(),
      operation,
      code: 'TEMPORARY_FAILURE',
      driverCodes,
      errorNames,
      tables,
    })
    return {
      ok: false,
      error: {
        code: 'TEMPORARY_FAILURE',
        message:
          operation === 'workspace.load'
            ? '작업 공간을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
            : '요청을 처리하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.',
      },
    }
  }
}
