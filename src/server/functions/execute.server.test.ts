import { afterAll, afterEach, describe, expect, spyOn, test } from 'bun:test'
import { z } from 'zod'
import { DomainError } from '../services/errors'
import { execute } from './execute.server'

const log = spyOn(console, 'error').mockImplementation(() => {})
afterEach(() => log.mockClear())
afterAll(() => log.mockRestore())

describe('작업 API 오류 진단', () => {
  test('작업공간 DB 오류의 코드와 테이블만 로그에 남긴다', async () => {
    const driver = Object.assign(new Error('relation "public.workspaces" does not exist'), {
      code: '42P01',
    })
    const error = new Error('private SQL with private-token', { cause: driver })
    const result = await execute('workspace.load', async () => {
      throw error
    })
    expect(result.ok).toBe(false)
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0]?.[0]).toBe('[dayflow:tasks] Operation failed')
    const diagnostic = log.mock.calls[0]?.[1]
    expect(diagnostic).toMatchObject({
      operation: 'workspace.load',
      code: 'TEMPORARY_FAILURE',
      driverCodes: ['42P01'],
      tables: ['workspaces'],
    })
    expect(diagnostic.requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(JSON.stringify([result, diagnostic])).not.toContain('private')
    expect(JSON.stringify(result)).not.toContain('42P01')
  })

  test('작업공간 생성에 필요한 고유 인덱스가 없을 때 42P10을 보존한다', async () => {
    await execute('workspace.load', async () => {
      throw new Error('private-query', { cause: { code: '42P10' } })
    })
    expect(log.mock.calls[0]?.[1].driverCodes).toEqual(['42P10'])
  })

  test('검증·도메인 오류와 성공 결과의 기존 계약을 유지한다', async () => {
    expect(await execute('task.get', async () => ({ id: 'task' }))).toEqual({
      ok: true,
      data: { id: 'task' },
    })
    expect(
      await execute('task.update', async () => {
        throw new DomainError('VERSION_CONFLICT', '수정 충돌', 3)
      }),
    ).toEqual({
      ok: false,
      error: { code: 'VERSION_CONFLICT', message: '수정 충돌', currentVersion: 3 },
    })
    const invalid = await execute('task.create', async () => z.string().parse(123))
    expect(!invalid.ok && invalid.error.code).toBe('INVALID_INPUT')
    expect(log).not.toHaveBeenCalled()
  })
})
