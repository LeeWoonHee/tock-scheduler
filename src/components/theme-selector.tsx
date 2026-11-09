import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/hooks/use-theme-store'
import { cn } from '@/lib/utils'
import type { ThemePreference } from '@/lib/theme'

const options = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
  { value: 'system', label: '시스템', icon: Monitor },
] satisfies { value: ThemePreference; label: string; icon: typeof Sun }[]

export function ThemeSelector() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-xs font-medium text-foreground">화면 모드</legend>
      <div className="flex gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <label key={value} className="min-w-0 flex-1 cursor-pointer">
            <input
              type="radio"
              name="appearance-theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex flex-col items-center gap-2.5 rounded-xl border px-2 py-4 text-xs transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
                theme === value
                  ? 'border-primary bg-primary/5 font-medium text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary',
              )}
            >
              <Icon size={20} strokeWidth={1.6} aria-hidden />
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
        {theme === 'system' ? '기기의 화면 모드를 따릅니다. ' : ''}이 브라우저에 자동으로
        저장됩니다.
      </p>
    </fieldset>
  )
}
