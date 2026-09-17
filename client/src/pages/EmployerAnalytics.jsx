import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  Briefcase,
  FileText,
  Users,
  Star,
  CalendarCheck,
  Trophy,
  TrendingUp,
  Building2,
  ExternalLink,
  User,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getEmployerAnalytics } from '../services/analyticsService'
import { friendlyError } from '../utils/errors'

function StatCard({ label, value, icon: Icon, accent = 'brand', hint }) {
  return (
    <div className="card">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
          accent === 'brand'
            ? 'bg-brand-50 text-brand-700'
            : accent === 'accent'
            ? 'bg-accent-50 text-accent-600'
            : accent === 'green'
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  )
}

function formatDate(ts) {
  if (!ts?.seconds) return '—'
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EmployerAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const result = await getEmployerAnalytics(user.uid)
        if (alive) setData(result)
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-app py-16 max-w-2xl text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { totals, jobStats, recentApps } = data

  return (
    <div className="container-app py-10 max-w-6xl">
      <Link
        to="/dashboard/employer"
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <TrendingUp size={28} className="text-brand-600" />
          Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          How your jobs are performing across SkillNest.
        </p>
      </div>

      {/* ============================
          TOP STATS
          ============================ */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total job views"
          value={totals.totalViews.toLocaleString()}
          icon={Eye}
          accent="brand"
          hint="Unique views per signed-in user"
        />
        <StatCard
          label="Applications"
          value={totals.totalApplications.toLocaleString()}
          icon={FileText}
          accent="accent"
          hint={
            totals.totalViews > 0
              ? `${totals.conversion}% of views`
              : 'No views yet'
          }
        />
        <StatCard
          label="Active jobs"
          value={totals.activeJobs}
          icon={Briefcase}
          accent="green"
          hint={`${totals.totalJobs} total`}
        />
        <StatCard
          label="Followers"
          value={totals.followers.toLocaleString()}
          icon={Users}
          accent="brand"
          hint="People following your company"
        />
      </div>

      {/* ============================
          FUNNEL
          ============================ */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-5">Hiring funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Applied', value: totals.totalApplications, color: 'bg-blue-50 text-blue-700' },
            { label: 'Pending', value: totals.pending, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Shortlisted', value: totals.shortlisted, color: 'bg-green-50 text-green-700' },
            { label: 'Interview', value: totals.interviews, color: 'bg-purple-50 text-purple-700' },
            { label: 'Hired', value: totals.hires, color: 'bg-brand-100 text-brand-800' },
            { label: 'Rejected', value: totals.rejected, color: 'bg-red-50 text-red-700' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className={`w-full h-20 rounded-xl flex items-center justify-center ${s.color}`}
              >
                <span className="text-3xl font-extrabold">{s.value}</span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-2">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================
          JOB PERFORMANCE TABLE
          ============================ */}
      <div className="card !p-0 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Job performance</h2>
          <Link
            to="/employer/jobs"
            className="text-sm text-brand-700 font-semibold hover:underline inline-flex items-center gap-1"
          >
            Manage jobs <ExternalLink size={12} />
          </Link>
        </div>

        {jobStats.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No jobs yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Post a job to start tracking performance.
            </p>
            <Link to="/employer/jobs/new" className="btn-primary inline-flex">
              Post a job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Job</th>
                  <th className="text-right px-3 py-3 font-semibold">Views</th>
                  <th className="text-right px-3 py-3 font-semibold">Apps</th>
                  <th className="text-right px-3 py-3 font-semibold hidden md:table-cell">
                    Conv.
                  </th>
                  <th className="text-right px-3 py-3 font-semibold hidden lg:table-cell">
                    Short.
                  </th>
                  <th className="text-right px-3 py-3 font-semibold hidden lg:table-cell">
                    Int.
                  </th>
                  <th className="text-right px-3 py-3 font-semibold hidden lg:table-cell">
                    Hired
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobStats.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-gray-900 truncate">
                        {j.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded ${
                            j.status === 'published'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {j.status}
                        </span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Eye size={12} className="text-gray-400" />
                        {j.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right px-3 py-3 font-medium">
                      {j.applications}
                    </td>
                    <td className="text-right px-3 py-3 hidden md:table-cell">
                      <span
                        className={`font-semibold ${
                          j.conversion >= 5
                            ? 'text-green-600'
                            : j.conversion >= 1
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {j.conversion}%
                      </span>
                    </td>
                    <td className="text-right px-3 py-3 hidden lg:table-cell text-green-700">
                      {j.shortlisted}
                    </td>
                    <td className="text-right px-3 py-3 hidden lg:table-cell text-purple-700">
                      {j.interviews}
                    </td>
                    <td className="text-right px-3 py-3 hidden lg:table-cell text-brand-700 font-semibold">
                      {j.hires}
                    </td>
                    <td className="text-right px-4 py-3">
                      <Link
                        to={`/employer/jobs/${j.id}/applicants`}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================
          RECENT APPLICATIONS
          ============================ */}
      {recentApps.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold">Recent applications</h2>
            <Link
              to="/employer/jobs"
              className="text-sm text-brand-700 font-semibold hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApps.map((a) => (
              <Link
                key={a.id}
                to={`/applicants/${a.applicantId}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <User size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {a.applicantEmail}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {a.jobTitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">
                    {formatDate(a.createdAt)}
                  </div>
                  <div className="text-xs font-semibold text-brand-700 capitalize">
                    {a.status?.replace('_', ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}