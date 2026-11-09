export type ThemePreference = 'light' | 'dark' | 'system'
export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'dayflow.theme'

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ThemeMode {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

export function readThemePreference(storage: Pick<Storage, 'getItem'>): ThemePreference {
  try {
    return parseThemePreference(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system'
  }
}

// Runs before styles paint, independent of React hydration and storage availability.
export const THEME_BOOTSTRAP_SCRIPT = `(()=>{let theme='system';try{const saved=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(saved==='light'||saved==='dark')theme=saved}catch{}const dark=theme==='dark'||(theme==='system'&&typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'})()`
