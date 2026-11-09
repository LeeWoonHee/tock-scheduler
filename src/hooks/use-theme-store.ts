import { create } from 'zustand'
import { THEME_STORAGE_KEY, resolveTheme, type ThemeMode, type ThemePreference } from '@/lib/theme'

function applyTheme(resolvedTheme: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.style.colorScheme = resolvedTheme
}

type ThemeState = {
  theme: ThemePreference
  resolvedTheme: ThemeMode
  setTheme: (theme: ThemePreference) => void
  syncTheme: (theme: ThemePreference, systemDark: boolean) => void
}

// Browser preferences are hydrated after mount; server renders never mutate this store.
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    if (typeof window === 'undefined') return
    const resolvedTheme = resolveTheme(
      theme,
      window.matchMedia('(prefers-color-scheme: dark)').matches,
    )
    applyTheme(resolvedTheme)
    set({ theme, resolvedTheme })
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The selection still works for this tab when browser storage is blocked.
    }
  },
  syncTheme: (theme, systemDark) => {
    const resolvedTheme = resolveTheme(theme, systemDark)
    applyTheme(resolvedTheme)
    set({ theme, resolvedTheme })
  },
}))
