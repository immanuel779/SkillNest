import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()

  const options = [
    { v: 'light', l: 'Light', Icon: Sun },
    { v: 'dark', l: 'Dark', Icon: Moon },
    { v: 'system', l: 'System', Icon: Monitor },
  ]

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0.5 ${className}`}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ v, l, Icon }) => {
        const active = theme === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => setTheme(v)}
            className={`px-2.5 h-7 rounded-md flex items-center gap-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400'
            }`}
            title={l}
            aria-pressed={active}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{l}</span>
          </button>
        )
      })}
    </div>
  )
}