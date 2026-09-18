import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Bell,
  Calendar,
  User,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Plus,
  Users,
  TrendingUp,
  Shield,
  PenSquare,
  KeyRound,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const CATEGORY_ORDER = ['Navigation', 'Actions', 'Appearance', 'Account']

function fuzzyIncludes(haystack, needle) {
  if (!needle) return true
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  // simple substring match — fast and predictable
  return h.includes(n)
}

export default function CommandPalette({ onClose }) {
  const { user, profile, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const isEmployer = profile?.role === 'employer'
  const isAdmin = profile?.role === 'admin'
  const isJobSeeker = profile?.role === 'job_seeker'

  const commands = useMemo(() => {
    const items = []

    // Navigation items — vary by role
    items.push(
      { id: 'nav-jobs', group: 'Navigation', label: 'Find Jobs', icon: Briefcase, action: () => navigate('/jobs'), keywords: 'jobs search browse' },
      { id: 'nav-companies', group: 'Navigation', label: 'Browse Companies', icon: Building2, action: () => navigate('/companies'), keywords: 'companies employers' }
    )

    if (isJobSeeker) {
      items.push(
        { id: 'nav-applications', group: 'Navigation', label: 'My Applications', icon: FileText, action: () => navigate('/applications'), keywords: 'applications status' },
        { id: 'nav-saved', group: 'Navigation', label: 'Saved Jobs', icon: Bookmark, action: () => navigate('/saved-jobs'), keywords: 'saved bookmarks' },
        { id: 'nav-searches', group: 'Navigation', label: 'My Searches', icon: Search, action: () => navigate('/searches'), keywords: 'saved searches alerts' },
        { id: 'nav-interviews', group: 'Navigation', label: 'My Interviews', icon: Calendar, action: () => navigate('/interviews'), keywords: 'interviews scheduled' },
        { id: 'nav-profile', group: 'Navigation', label: 'My Profile', icon: User, action: () => navigate('/profile/job-seeker'), keywords: 'profile resume skills' },
        { id: 'nav-dashboard', group: 'Navigation', label: 'Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard/job-seeker'), keywords: 'home overview' }
      )
    }

    if (isEmployer) {
      items.push(
        { id: 'nav-company', group: 'Navigation', label: 'Company Profile', icon: Building2, action: () => navigate('/employer/company'), keywords: 'company branding slug' },
        { id: 'nav-my-jobs', group: 'Navigation', label: 'My Jobs', icon: Briefcase, action: () => navigate('/employer/jobs'), keywords: 'jobs postings' },
        { id: 'nav-team', group: 'Navigation', label: 'Team', icon: Users, action: () => navigate('/employer/team'), keywords: 'team seats recruiters' },
        { id: 'nav-updates', group: 'Navigation', label: 'Company Updates', icon: PenSquare, action: () => navigate('/employer/updates'), keywords: 'updates posts followers' },
        { id: 'nav-analytics', group: 'Navigation', label: 'Analytics', icon: TrendingUp, action: () => navigate('/employer/analytics'), keywords: 'analytics stats views' },
        { id: 'nav-emp-interviews', group: 'Navigation', label: 'Interviews', icon: Calendar, action: () => navigate('/employer/interviews'), keywords: 'interviews scheduled' },
        { id: 'nav-emp-dashboard', group: 'Navigation', label: 'Employer Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard/employer'), keywords: 'dashboard overview' }
      )
    }

    if (isAdmin) {
      items.push(
        { id: 'nav-admin', group: 'Navigation', label: 'Admin Console', icon: Shield, action: () => navigate('/admin'), keywords: 'admin console' },
        { id: 'nav-admin-users', group: 'Navigation', label: 'Admin · Users', icon: Users, action: () => navigate('/admin/users'), keywords: 'admin users' },
        { id: 'nav-admin-jobs', group: 'Navigation', label: 'Admin · Jobs', icon: Briefcase, action: () => navigate('/admin/jobs'), keywords: 'admin jobs' },
        { id: 'nav-admin-reports', group: 'Navigation', label: 'Admin · Reports', icon: Shield, action: () => navigate('/admin/reports'), keywords: 'admin reports' }
      )
    }

    // Shared navigation
    if (user) {
      items.push(
        { id: 'nav-messages', group: 'Navigation', label: 'Messages', icon: MessageSquare, action: () => navigate('/messages'), keywords: 'chat messages inbox' },
        { id: 'nav-notifications', group: 'Navigation', label: 'Notifications', icon: Bell, action: () => navigate('/notifications'), keywords: 'notifications alerts' },
        { id: 'nav-settings', group: 'Navigation', label: 'Settings', icon: SettingsIcon, action: () => navigate('/settings'), keywords: 'settings account password email' }
      )
    }

    // Actions
    if (isEmployer) {
      items.push(
        { id: 'act-post-job', group: 'Actions', label: 'Post a new job', icon: Plus, action: () => navigate('/employer/jobs/new'), keywords: 'post create new job' },
        { id: 'act-invite', group: 'Actions', label: 'Invite a team member', icon: Users, action: () => navigate('/employer/team'), keywords: 'invite team member recruiter' }
      )
    }

    if (isJobSeeker) {
      items.push(
        { id: 'act-edit-profile', group: 'Actions', label: 'Edit profile', icon: PenSquare, action: () => navigate('/profile/job-seeker'), keywords: 'edit profile resume' },
        { id: 'act-save-search', group: 'Actions', label: 'Create a saved search', icon: Search, action: () => navigate('/jobs'), keywords: 'save search alert jobs' }
      )
    }

    if (user) {
      items.push(
        { id: 'act-change-password', group: 'Actions', label: 'Change password', icon: KeyRound, action: () => navigate('/settings'), keywords: 'change password security' },
        { id: 'act-signout', group: 'Actions', label: 'Sign out', icon: LogOut, action: async () => { await logout(); navigate('/') }, keywords: 'logout sign out exit' }
      )
    }

    // Appearance
    items.push(
      { id: 'theme-light', group: 'Appearance', label: 'Theme: Light', icon: Sun, action: () => setTheme('light'), keywords: 'theme light mode appearance', check: theme === 'light' },
      { id: 'theme-dark', group: 'Appearance', label: 'Theme: Dark', icon: Moon, action: () => setTheme('dark'), keywords: 'theme dark mode appearance', check: theme === 'dark' },
      { id: 'theme-system', group: 'Appearance', label: 'Theme: System', icon: Monitor, action: () => setTheme('system'), keywords: 'theme system auto appearance', check: theme === 'system' }
    )

    return items
  }, [user, isEmployer, isAdmin, isJobSeeker, navigate, logout, setTheme, theme])

  // Filter + group
  const filtered = useMemo(() => {
    const q = query.trim()
    const list = commands.filter((c) => {
      if (!q) return true
      const hay = `${c.label} ${c.keywords || ''}`.toLowerCase()
      return fuzzyIncludes(hay, q)
    })

    // Group by category in defined order
    const groups = {}
    list.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = []
      groups[c.group].push(c)
    })

    const ordered = []
    CATEGORY_ORDER.forEach((cat) => {
      if (groups[cat]) {
        ordered.push({ type: 'header', label: cat })
        groups[cat].forEach((c) => ordered.push({ type: 'item', command: c }))
      }
    })
    return ordered
  }, [commands, query])

  // Flat list of items (for keyboard nav)
  const flatItems = useMemo(
    () => filtered.filter((f) => f.type === 'item').map((f) => f.command),
    [filtered]
  )

  // Reset active index when the filtered list changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(Math.max(0, flatItems.length - 1))
    }
  }, [flatItems.length, activeIndex])

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep active item scrolled into view
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const activeEl = container.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Global key handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (flatItems.length ? (i + 1) % flatItems.length : 0))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (flatItems.length ? (i - 1 + flatItems.length) % flatItems.length : 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = flatItems[activeIndex]
        if (cmd) {
          Promise.resolve(cmd.action()).catch(() => {})
          onClose()
        }
        return
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [flatItems, activeIndex, onClose])

  // Track the running index while rendering groups
  let runningIndex = -1

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, actions..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto py-2"
        >
          {flatItems.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Zap size={28} className="mx-auto mb-2 opacity-60" />
              <p className="text-sm">No matches for "{query}"</p>
            </div>
          ) : (
            filtered.map((row, idx) => {
              if (row.type === 'header') {
                return (
                  <div
                    key={`h-${row.label}-${idx}`}
                    className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                  >
                    {row.label}
                  </div>
                )
              }
              runningIndex += 1
              const isActive = runningIndex === activeIndex
              const cmd = row.command
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.id}
                  data-active={isActive}
                  onMouseEnter={() => setActiveIndex(runningIndex)}
                  onClick={() => {
                    Promise.resolve(cmd.action()).catch(() => {})
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 text-left truncate">{cmd.label}</span>
                  {cmd.check && (
                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 rounded px-1.5 py-0.5">
                      Active
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="border border-gray-300 dark:border-gray-700 rounded px-1.5">↑</kbd>
              <kbd className="border border-gray-300 dark:border-gray-700 rounded px-1.5">↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="border border-gray-300 dark:border-gray-700 rounded px-1.5">↵</kbd>
              select
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="border border-gray-300 dark:border-gray-700 rounded px-1.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}