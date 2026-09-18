import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Briefcase,
  LogOut,
  Settings as SettingsIcon,
  Keyboard,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import NotificationBell from './NotificationBell'
import ThemeMenuButton from './ThemeMenuButton'
import { subscribeUnreadMessageCount } from '../services/messageService'

function ThemeToggleInline() {
  const { theme, setTheme } = useTheme()
  const options = [
    { v: 'light', l: 'Light' },
    { v: 'dark', l: 'Dark' },
    { v: 'system', l: 'Auto' },
  ]
  return (
    <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => setTheme(o.v)}
          className={`px-2 h-6 rounded text-[11px] font-semibold transition ${
            theme === o.v
              ? 'bg-brand-700 text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0)
      return
    }
    const unsub = subscribeUnreadMessageCount(user.uid, setUnreadMessages)
    return unsub
  }, [user])

  const publicLinks = [
    { name: 'Find Jobs', path: '/jobs' },
    { name: 'Companies', path: '/companies' },
    { name: 'For Employers', path: '/' },
    { name: 'How It Works', path: '/' },
  ]

  const roleLinks = (() => {
    if (!user) return []
    if (profile?.role === 'admin') {
      return [{ name: 'Admin Console', path: '/admin', danger: true }]
    }
    if (profile?.role === 'employer') {
      return [
        { name: 'Company', path: '/employer/company' },
        { name: 'Jobs', path: '/employer/jobs' },
        { name: 'Updates', path: '/employer/updates' },
        { name: 'Interviews', path: '/employer/interviews' },
        { name: 'Team', path: '/employer/team' },
      ]
    }
    return [
      { name: 'Find Jobs', path: '/jobs' },
      { name: 'Companies', path: '/companies' },
      { name: 'Applications', path: '/applications' },
      { name: 'Saved', path: '/saved-jobs' },
      { name: 'Searches', path: '/searches' },
      { name: 'Interviews', path: '/interviews' },
    ]
  })()

  const dashboardPath = profile?.role
    ? `/dashboard/${profile.role.replace('_', '-')}`
    : '/'

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate('/')
  }

  const openShortcutsHelp = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
  }

  const close = () => setIsOpen(false)

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-sm shadow-brand-900/5'
          : 'bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="container-app">
        <div className="flex justify-between items-center h-16 lg:h-18 gap-3">
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow duration-300">
                <Briefcase size={18} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-brand-gradient blur-md opacity-40 -z-10 group-hover:opacity-60 transition-opacity" />
            </div>
            <span className="text-lg xl:text-xl font-extrabold tracking-tight whitespace-nowrap hidden xs:inline">
              <span className="text-gray-900 dark:text-white">Skill</span>
              <span className="gradient-text">Nest</span>
            </span>
          </Link>

          {!user && (
            <div className="hidden lg:flex items-center gap-1 mx-auto">
              {publicLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className="relative px-3 xl:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 rounded-lg transition-colors group whitespace-nowrap"
                >
                  {link.name}
                  <span className="absolute bottom-1 left-3 right-3 xl:left-4 xl:right-4 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-full" />
                </NavLink>
              ))}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-2 xl:gap-3 ml-auto shrink-0">
            {user ? (
              <>
                {roleLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                      link.danger
                        ? 'text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400'
                    }`}
                  >
                    {link.name}
                  </NavLink>
                ))}

                <Link
                  to="/messages"
                  className="relative text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors whitespace-nowrap"
                >
                  Messages
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {profile?.role !== 'admin' && (
                  <Link
                    to={dashboardPath}
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors whitespace-nowrap"
                  >
                    Dashboard
                  </Link>
                )}
                <button
  onClick={() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      })
    )
  }}
  className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-brand-700 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition"
  aria-label="Open command palette"
  title="Command palette (⌘K)"
>
  <Search size={13} />
  <span>Search</span>
  <kbd className="ml-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">⌘K</kbd>
</button>

                {/* Theme toggle */}
                <ThemeMenuButton />

                {/* Keyboard shortcuts help */}
                <button
                  onClick={openShortcutsHelp}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard size={18} />
                </button>

                <Link
                  to="/settings"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Settings"
                >
                  <SettingsIcon size={18} />
                </Link>

                <NotificationBell />

                <button
                  onClick={handleLogout}
                  className="btn-outline text-sm !py-2 !px-3 whitespace-nowrap"
                  aria-label="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="hidden xl:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <ThemeMenuButton />
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass border-t border-white/40 dark:border-gray-800 px-4 pt-4 pb-6 overflow-y-auto max-h-[80vh]">
          {!user && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 mb-2">
                Explore
              </p>
              <div className="space-y-1">
                {publicLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={close}
                    className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300">
                <span className="font-medium">Theme</span>
                <ThemeToggleInline />
              </div>

              <div className="pt-4 mt-4 border-t border-white/40 dark:border-gray-800 space-y-2">
                <Link
                  to="/login"
                  onClick={close}
                  className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium text-center transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="btn-primary w-full"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}

          {user && (
            <>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 mb-2">
                  {profile?.role === 'admin'
                    ? 'Administration'
                    : profile?.role === 'employer'
                    ? 'Employer'
                    : 'Job Seeker'}
                </p>
                <div className="space-y-1">
                  {roleLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={close}
                      className={`block px-3 py-2.5 rounded-lg font-medium transition-colors ${
                        link.danger
                          ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    to="/messages"
                    onClick={close}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              <div className="pt-3 border-t border-white/40 dark:border-gray-800 mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 mb-2">
                  Account
                </p>
                <div className="space-y-1">
                  {profile?.role !== 'admin' && (
                    <Link
                      to={dashboardPath}
                      onClick={close}
                      className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}

                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Theme</span>
                    <ThemeToggleInline />
                  </div>

                  <button
                    onClick={() => {
                      close()
                      openShortcutsHelp()
                    }}
                    className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    <span>Keyboard shortcuts</span>
                    <Keyboard size={14} />
                  </button>

                  <Link
                    to="/settings"
                    onClick={close}
                    className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    Settings
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={close}
                    className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    Notifications
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full btn-outline mt-3"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}