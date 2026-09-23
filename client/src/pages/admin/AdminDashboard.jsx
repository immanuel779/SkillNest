import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck,
  Trophy,
  Flag,
  TrendingUp,
} from 'lucide-react'
import { getPlatformStats } from '../../services/adminService'
import NotificationBell from '../../components/NotificationBell'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await getPlatformStats()
        if (alive) setStats(s)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const cards = [
    {
      label: 'Total Users',
      value: stats?.users,
      icon: Users,
      color: 'brand',
      to: '/admin/users',
    },
    {
      label: 'Employers',
      value: stats?.employers,
      icon: Building2,
      color: 'accent',
      to: '/admin/companies',
    },
    {
      label: 'Active Jobs',
      value: stats?.activeJobs,
      icon: Briefcase,
      color: 'brand',
      to: '/admin/jobs',
    },
    {
      label: 'Applications',
      value: stats?.applications,
      icon: FileText,
      color: 'accent',
      to: '/admin/applications',
    },
    {
      label: 'Interviews',
      value: stats?.interviews,
      icon: CalendarCheck,
      color: 'brand',
      to: null,
    },
    { label: 'Hires', value: stats?.hires, icon: Trophy, color: 'accent', to: null },
    {
      label: 'Open Reports',
      value: stats?.openReports,
      icon: Flag,
      color: 'red',
      to: '/admin/reports',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">Platform overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time stats across the entire SkillNest platform.
          </p>
        </div>
        <NotificationBell />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const inner = (
            <div className="card card-hover h-full">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  c.color === 'brand'
                    ? 'bg-brand-50 text-brand-700'
                    : c.color === 'accent'
                    ? 'bg-accent-50 text-accent-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                <c.icon size={18} />
              </div>
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-3xl font-extrabold mt-1">
                {loading ? '—' : c.value ?? 0}
              </div>
            </div>
          )
          return c.to ? (
            <Link key={c.label} to={c.to} className="block">
              {inner}
            </Link>
          ) : (
            <div key={c.label}>{inner}</div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" />
            Platform health
          </h3>
          <p className="text-sm text-gray-600">
            All systems operational. You can review reports, suspend accounts,
            and moderate jobs from the sidebar.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-bold mb-2">Quick actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/users"
              className="btn-outline !py-2 !px-3 text-sm"
            >
              Manage users
            </Link>
            <Link
              to="/admin/jobs"
              className="btn-outline !py-2 !px-3 text-sm"
            >
              Review jobs
            </Link>
            <Link
              to="/admin/reports"
              className="btn-outline !py-2 !px-3 text-sm"
            >
              Open reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}