import { describe, expect, test } from 'bun:test'
import { runInNewContext } from 'node:vm'
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  parseThemePreference,
  readThemePreference,
  resolveTheme,
} from './theme'

function bootstrap(saved: string | null, systemDark: boolean, storageBlocked = false) {
  const classes = new Set<string>()
  const root = {
    classList: {
      toggle: (name: string, enabled: boolean) => {
        if (enabled) classes.add(name)
        else classes.delete(name)
      },
    },
    style: { colorScheme: '' },
  }
  runInNewContext(THEME_BOOTSTRAP_SCRIPT, {
    localStorage: {
      getItem: (key: string) => {
        expect(key).toBe(THEME_STORAGE_KEY)
        if (storageBlocked) throw new Error('Storage unavailable')
        return saved
      },
    },
    matchMedia: () => ({ matches: systemDark }),
    document: { documentElement: root },
  })
  return { dark: classes.has('dark'), colorScheme: root.style.colorScheme }
}

describe('화면 모드', () => {
  test('저장한 라이트 모드는 OS 다크 설정보다 우선한다', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(bootstrap('light', true)).toEqual({ dark: false, colorScheme: 'light' })
  })
  test('저장한 다크 모드를 React가 그리기 전에 복원한다', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(bootstrap('dark', false)).toEqual({ dark: true, colorScheme: 'dark' })
  })
  test('시스템 모드는 운영체제의 화면 모드를 따른다', () => {
    expect(bootstrap('system', true)).toEqual({ dark: true, colorScheme: 'dark' })
    expect(bootstrap('system', false)).toEqual({ dark: false, colorScheme: 'light' })
  })
  test('첫 방문과 잘못된 저장 값은 시스템 모드로 처리한다', () => {
    expect(parseThemePreference(null)).toBe('system')
    expect(parseThemePreference('invalid')).toBe('system')
    expect(bootstrap(null, true).dark).toBe(true)
    expect(bootstrap('invalid', false).dark).toBe(false)
  })
  test('브라우저 저장소가 막혀도 초기 화면을 표시한다', () => {
    expect(
      readThemePreference({
        getItem: () => {
          throw new Error('Blocked')
        },
      }),
    ).toBe('system')
    expect(bootstrap('light', true, true)).toEqual({ dark: true, colorScheme: 'dark' })
  })
})
