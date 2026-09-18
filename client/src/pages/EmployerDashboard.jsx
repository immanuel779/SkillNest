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
import { listMyInterviews } from '../services/interviewService'

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
        const [jobs, interviewsList] = await Promise.all([
          listMyJobs(user.uid),
          listMyInterviews(user.uid, 'employer'),
        ])
        if (!alive) return

        const activeJobs = jobs.filter((j) => j.status === 'published').length

        const appsSnap = await getDocs(
          query(
            collection(db, 'applications'),
            where('employerId', '==', user.uid)
          )
        )
        const apps = appsSnap.docs.map((d) => d.data())

        // Compute per-job counts from the real applications.
        const countsByJob = {}
        apps.forEach((a) => {
          if (a.jobId) countsByJob[a.jobId] = (countsByJob[a.jobId] || 0) + 1
        })

        const jobsWithCounts = jobs.map((j) => ({
          ...j,
          applicantCount: countsByJob[j.id] || 0,
        }))

        const totalApplicants = apps.length

        const upcomingInterviews = interviewsList.filter(
          (i) => i.status === 'scheduled'
        ).length

        if (!alive) return
        setStats({
          activeJobs,
          applicants: totalApplicants,
          shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
          interviews: upcomingInterviews,
          hires: apps.filter((a) => a.status === 'hired').length,
        })
        setRecentJobs(jobsWithCounts.slice(0, 4))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

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
      <div className="flex justify-between items-center mb-6 sm:mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Employer Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Welcome, {profile?.fullName || user?.email}.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link to="/employer/analytics" className="btn-outline">
            <TrendingUp size={16} /> Analytics
          </Link>
          <Link to="/employer/jobs/new" className="btn-primary">
            <Plus size={16} /> Post a job
          </Link>
        </div>
      </div>

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