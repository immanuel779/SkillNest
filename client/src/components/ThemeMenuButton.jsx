import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ICONS = { light: Sun, dark: Moon, system: Monitor }

export default function ThemeMenuButton() {
  const { theme, setTheme, isDark } = useTheme()

  const cycle = () => {
    const order = ['light', 'dark', 'system']
    const idx = order.indexOf(theme)
    const next = order[(idx + 1) % order.length]
    setTheme(next)
  }

  const Icon = ICONS[theme] || Monitor
  const label =
    theme === 'system'
      ? `System (${isDark ? 'dark' : 'light'})`
      : theme[0].toUpperCase() + theme.slice(1)

  return (
    <button
      onClick={cycle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      <Icon size={18} />
    </button>
  )
}