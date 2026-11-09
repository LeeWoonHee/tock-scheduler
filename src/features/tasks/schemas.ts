import { z } from 'zod'
import { validDate, validZone } from '@/lib/dates'

export const idSchema = z.string().min(1).max(100)
export const dateSchema = z.string().refine(validDate, '올바른 날짜를 입력해 주세요.')
export const zoneSchema = z.string().max(100).refine(validZone, '올바른 시간대를 선택해 주세요.')
const instantSchema = z.string().datetime({ offset: true })
export const scheduleSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('allDay'), startDate: dateSchema, endDateExclusive: dateSchema })
    .strict()
    .refine(
      (value) => value.endDateExclusive > value.startDate,
      '종료 날짜는 시작 날짜보다 늦어야 합니다.',
    ),
  z
    .object({
      kind: z.literal('timed'),
      startAt: instantSchema,
      endAt: instantSchema.nullable(),
      zoneId: zoneSchema,
    })
    .strict()
    .refine(
      (value) => !value.endAt || Date.parse(value.endAt) > Date.parse(value.startAt),
      '종료 시각은 시작 시각보다 늦어야 합니다.',
    ),
])
export const baseMutationSchema = z.object({ requestId: z.string().uuid() })
export const versionedSchema = baseMutationSchema
  .extend({ taskId: idSchema, expectedVersion: z.number().int().positive() })
  .strict()
export const createTaskSchema = baseMutationSchema
  .extend({
    title: z.string().trim().min(1, '할 일을 입력해 주세요.').max(500),
    listId: idSchema,
    sectionId: idSchema.nullable().optional(),
    schedule: scheduleSchema.nullable().default(null),
    priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
    tagIds: z.array(idSchema).max(30).default([]),
  })
  .strict()
export const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    body: z.string().max(20000).optional(),
    priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
    schedule: scheduleSchema.nullable().optional(),
    tagIds: z.array(idSchema).max(30).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, '수정할 내용이 없습니다.')
export const updateTaskSchema = versionedSchema.extend({ patch: patchSchema }).strict()
export const moveTaskSchema = versionedSchema
  .extend({
    listId: idSchema,
    sectionId: idSchema.nullable().default(null),
    beforeId: idSchema.optional(),
    afterId: idSchema.optional(),
  })
  .strict()
  .refine((value) => !(value.beforeId && value.afterId), '앞이나 뒤의 항목 하나만 지정해 주세요.')
export const listQuerySchema = z
  .object({
    view: z.enum(['inbox', 'today', 'upcoming', 'list', 'trash']).default('inbox'),
    listId: idSchema.optional(),
    filter: z
      .object({
        query: z.string().max(500).optional(),
        tagId: idSchema.optional(),
        priority: z.number().int().min(0).max(3).optional(),
      })
      .strict()
      .optional(),
    cursor: idSchema.optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .strict()
  .refine((value) => value.view !== 'list' || !!value.listId, '리스트 ID가 필요합니다.')
export const calendarQuerySchema = z
  .object({ from: dateSchema, to: dateSchema, zoneId: zoneSchema })
  .strict()
  .refine(
    (value) =>
      value.to > value.from && (Date.parse(value.to) - Date.parse(value.from)) / 86400000 <= 62,
    '달력 조회 범위는 최대 62일입니다.',
  )
export const createListSchema = baseMutationSchema
  .extend({
    name: z.string().trim().min(1).max(80),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default('#002FA7'),
  })
  .strict()
export const createSectionSchema = baseMutationSchema
  .extend({ listId: idSchema, name: z.string().trim().min(1).max(80) })
  .strict()
export const createTagSchema = baseMutationSchema
  .extend({
    name: z.string().trim().min(1).max(40),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default('#002FA7'),
  })
  .strict()
