import { describe, expect, test } from 'bun:test'
import {
  addDays,
  allDay,
  dateInZone,
  dayStart,
  monthCells,
  scheduleOverlaps,
  validDate,
  fromLocalDateTime,
  moveScheduleToDate,
} from './dates'
import { calendarQuerySchema, scheduleSchema } from '@/features/tasks/schemas'

describe('날짜 및 시간대', () => {
  test('윤일을 검증하고 잘못된 날짜를 거절한다', () => {
    expect(validDate('2024-02-29')).toBe(true)
    expect(validDate('2026-02-29')).toBe(false)
    expect(validDate('2026-02-31')).toBe(false)
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
  test('한국의 자정은 UTC 전날 15시다', () => {
    expect(new Date(dayStart('2026-11-09', 'Asia/Seoul')).toISOString()).toBe(
      '2026-11-08T15:00:00.000Z',
    )
    expect(dateInZone('2026-11-08T15:01:00Z', 'Asia/Seoul')).toBe('2026-11-09')
  })
  test('DST 전환일을 24시간으로 가정하지 않는다', () => {
    expect(
      (dayStart('2026-03-09', 'America/New_York') - dayStart('2026-03-08', 'America/New_York')) /
        3600000,
    ).toBe(23)
    expect(
      (dayStart('2026-11-02', 'America/New_York') - dayStart('2026-11-01', 'America/New_York')) /
        3600000,
    ).toBe(25)
  })
  test('종일 날짜는 표시 시간대가 달라져도 유지된다', () => {
    const event = allDay('2026-11-09')
    for (const zone of ['Asia/Seoul', 'America/Los_Angeles', 'Pacific/Auckland']) {
      expect(scheduleOverlaps(event, '2026-11-09', '2026-11-10', zone)).toBe(true)
      expect(scheduleOverlaps(event, '2026-11-10', '2026-11-11', zone)).toBe(false)
    }
  })
  test('다일 일정은 종료일을 포함하지 않는다', () => {
    const event = {
      kind: 'allDay' as const,
      startDate: '2026-11-09',
      endDateExclusive: '2026-11-12',
    }
    expect(scheduleOverlaps(event, '2026-11-11', '2026-11-12', 'UTC')).toBe(true)
    expect(scheduleOverlaps(event, '2026-11-12', '2026-11-13', 'UTC')).toBe(false)
  })
  test('시각 일정은 겹침으로 조회하고 끝 경계를 제외한다', () => {
    const event = {
      kind: 'timed' as const,
      startAt: '2026-11-08T14:00:00Z',
      endAt: '2026-11-08T16:00:00Z',
      zoneId: 'Asia/Seoul',
    }
    expect(scheduleOverlaps(event, '2026-11-09', '2026-11-10', 'Asia/Seoul')).toBe(true)
    expect(
      scheduleOverlaps(
        { ...event, endAt: '2026-11-08T15:00:00Z' },
        '2026-11-09',
        '2026-11-10',
        'Asia/Seoul',
      ),
    ).toBe(false)
  })
  test('월요일 시작 42칸 달력과 월 경계를 생성한다', () => {
    const days = monthCells('2026-11')
    expect(days).toHaveLength(42)
    expect(days[0]).toBe('2026-10-26')
    expect(days[41]).toBe('2026-12-06')
  })
  test('일정의 필드 조합과 최대 조회 범위를 검증한다', () => {
    expect(
      scheduleSchema.safeParse({
        kind: 'allDay',
        startDate: '2026-11-09',
        endDateExclusive: '2026-11-09',
      }).success,
    ).toBe(false)
    expect(
      scheduleSchema.safeParse({
        kind: 'timed',
        startAt: '2026-11-09T12:00:00Z',
        endAt: '2026-11-09T11:00:00Z',
        zoneId: 'UTC',
      }).success,
    ).toBe(false)
    expect(
      calendarQuerySchema.safeParse({ from: '2026-01-01', to: '2026-04-01', zoneId: 'Asia/Seoul' })
        .success,
    ).toBe(false)
  })
  test('시각 입력의 시간대를 적용하고 중복 시각은 먼저 오는 시각을 선택한다', () => {
    expect(fromLocalDateTime('2026-11-09T09:30', 'Asia/Seoul')).toBe('2026-11-09T00:30:00.000Z')
    expect(fromLocalDateTime('2026-11-01T01:30', 'America/New_York')).toBe(
      '2026-11-01T05:30:00.000Z',
    )
    expect(() => fromLocalDateTime('2026-03-08T02:30', 'America/New_York')).toThrow()
  })
  test('캘린더에서 DST를 넘어 옮겨도 현지 시각과 실제 길이를 유지한다', () => {
    const moved = moveScheduleToDate(
      {
        kind: 'timed',
        startAt: '2026-03-07T14:00:00Z',
        endAt: '2026-03-07T15:00:00Z',
        zoneId: 'America/New_York',
      },
      '2026-03-08',
      'America/New_York',
    )
    expect(moved).toMatchObject({
      startAt: '2026-03-08T13:00:00.000Z',
      endAt: '2026-03-08T14:00:00.000Z',
    })
  })
})
