import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/hooks/use-theme-store'
import { parseThemePreference, readThemePreference, THEME_STORAGE_KEY } from '@/lib/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const { syncTheme } = useThemeStore.getState()
    let preference = useThemeStore.getState().theme
    try {
      preference = readThemePreference(window.localStorage)
    } catch {
      // Even accessing localStorage can throw in restricted browser contexts.
    }
    syncTheme(preference, media.matches)

    const onSystemChange = () => syncTheme(useThemeStore.getState().theme, media.matches)
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null)
        syncTheme(parseThemePreference(event.newValue), media.matches)
    }
    media.addEventListener('change', onSystemChange)
    window.addEventListener('storage', onStorage)
    return () => {
      media.removeEventListener('change', onSystemChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return children
}
