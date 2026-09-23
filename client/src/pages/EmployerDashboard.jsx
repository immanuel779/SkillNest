import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Star,
  CalendarCheck,
  Trophy,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { listMyJobs } from '../services/jobService'
import NotificationBell from '../components/NotificationBell'

export default function EmployerDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    activeJobs: 0,
    applicants: 0,
    shortlisted: 0,
    interviews: 0,
    hires: 0,
  })
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        // ---- Jobs ----
        const jobs = await listMyJobs(user.uid).catch(() => [])
        const activeJobs = jobs.filter((j) => j.status === 'published').length

        // ---- Applications ----
        let apps = []
        try {
          const q = query(
            collection(db, 'applications'),
            where('employerId', '==', user.uid)
          )
          const snap = await getDocs(q)
          apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        } catch (err) {
          console.warn('applications query failed:', err?.message)
        }

        // Fallback: if nothing found and user has a companyId, try that
        if (apps.length === 0 && profile?.companyId) {
          try {
            const q = query(
              collection(db, 'applications'),
              where('companyId', '==', profile.companyId)
            )
            const snap = await getDocs(q)
            const alt = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            if (alt.length > 0) apps = alt
          } catch (err) {
            console.warn('applications by companyId failed:', err?.message)
          }
        }

        if (!alive) return

        // ---- Stats ----
        // "Interviews" counts applications that have reached the interview stage.
        // This matches what you see in the applicants pipeline.
        const counts = {
          activeJobs,
          applicants: apps.length,
          shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
          interviews: apps.filter((a) => a.status === 'interview').length,
          hires: apps.filter((a) => a.status === 'hired').length,
        }

        // ---- Per-job counts for recent jobs list ----
        const countsByJob = {}
        apps.forEach((a) => {
          if (a.jobId) countsByJob[a.jobId] = (countsByJob[a.jobId] || 0) + 1
        })

        const jobsWithCounts = jobs.map((j) => ({
          ...j,
          applicantCount: countsByJob[j.id] || 0,
        }))

        setStats(counts)
        setRecentJobs(jobsWithCounts.slice(0, 4))
      } catch (err) {
        console.error('Dashboard load failed:', err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, profile?.companyId])

  const cards = [
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'brand',
    },
    {
      label: 'Applicants',
      value: stats.applicants,
      icon: Users,
      color: 'accent',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted,
      icon: Star,
      color: 'brand',
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      icon: CalendarCheck,
      color: 'accent',
    },
    { label: 'Hires', value: stats.hires, icon: Trophy, color: 'brand' },
  ]

  return (
    <div className="container-app py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Employer Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Welcome, {profile?.fullName || user?.email}.
            </p>
          </div>
          {/* Bell only on desktop — mobile has one in the navbar */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <NotificationBell />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            to="/employer/analytics"
            className="btn-outline flex-1 justify-center"
          >
            <TrendingUp size={16} /> Analytics
          </Link>
          <Link
            to="/employer/jobs/new"
            className="btn-primary flex-1 justify-center"
          >
            <Plus size={16} /> Post a job
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                c.color === 'brand'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-accent-50 text-accent-600'
              }`}
            >
              <c.icon size={18} />
            </div>
            <div className="text-xs sm:text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1">
              {loading ? '—' : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="mt-8 sm:mt-10 card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold">Recent jobs</h2>
          <div className="flex items-center gap-4">
            <Link
              to="/employer/analytics"
              className="text-sm font-semibold text-accent-600 hover:underline inline-flex items-center gap-1"
            >
              <TrendingUp size={14} /> Analytics
            </Link>
            <Link
              to="/employer/jobs"
              className="text-sm text-brand-700 font-semibold hover:underline"
            >
              View all
            </Link>
          </div>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm">No jobs posted yet.</p>
            <Link
              to="/employer/jobs/new"
              className="btn-primary inline-flex mt-4"
            >
              <Plus size={16} /> Post your first job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentJobs.map((j) => (
              <Link
                key={j.id}
                to={`/employer/jobs/${j.id}/applicants`}
                className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 rounded-lg transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">
                    {j.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {j.status} · {j.applicantCount || 0}{' '}
                    {j.applicantCount === 1 ? 'applicant' : 'applicants'} ·{' '}
                    {j.views || 0} views
                  </div>
                </div>
                <span className="text-xs text-brand-700 font-semibold shrink-0 ml-2">
                  View →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}