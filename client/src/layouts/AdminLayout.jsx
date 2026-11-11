import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Flag,
  Shield,
  Megaphone,
  Sparkles,
  Palette,
  MessagesSquare,
  ShieldCheck,
  BookOpen, // 👈 Added BookOpen icon
} from 'lucide-react'

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { to: '/admin/ad-submissions', label: 'Ads & Submissions', icon: Megaphone },
  { to: '/admin/blog', label: 'Blog Manager', icon: BookOpen }, // 👈 Added Blog Link
  { to: '/admin/landing', label: 'Landing Page', icon: Palette },
  { to: '/admin/community', label: 'Community', icon: MessagesSquare },
  { to: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/admin/emma', label: 'Emma AI', icon: Sparkles },
]

export default function AdminLayout() {
  return (
    <div className="container-app py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
          <Shield size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">Admin Console</h1>
          <p className="text-xs md:text-sm text-gray-500">
            Manage the SkillNest platform.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <nav className="card !p-2 flex flex-col gap-1 border border-gray-200 dark:border-gray-800">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20 translate-x-1'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-700 dark:hover:text-brand-400'
                  }`
                }
              >
                <l.icon size={16} />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Horizontal pill nav — mobile/tablet only */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <nav className="flex gap-2 min-w-max pb-2">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition ${
                    isActive
                      ? 'bg-brand-700 text-white border-brand-700 shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700'
                  }`
                }
              >
                <l.icon size={14} />
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}