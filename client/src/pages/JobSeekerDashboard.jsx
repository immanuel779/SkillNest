import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Bookmark,
  CalendarCheck,
  Search,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyApplications } from '../services/applicationService'
import { listMySavedJobs } from '../services/savedJobService'
import { listMyInterviews } from '../services/interviewService'

export default function JobSeekerDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    applications: 0,
    saved: 0,
    interviews: 0,
    shortlisted: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const [apps, saved, interviews] = await Promise.all([
          listMyApplications(user.uid),
          listMySavedJobs(user.uid),
          listMyInterviews(user.uid, 'job_seeker'),
        ])
        if (!alive) return

        const upcomingInterviews = interviews.filter(
          (i) => i.status === 'scheduled'
        ).length

        setStats({
          applications: apps.length,
          saved: saved.length,
          interviews: upcomingInterviews,
          shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
        })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const cards = [
    { label: 'Applications', value: stats.applications, icon: Briefcase, color: 'brand' },
    { label: 'Saved Jobs', value: stats.saved, icon: Bookmark, color: 'accent' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: TrendingUp, color: 'brand' },
    { label: 'Interviews', value: stats.interviews, icon: CalendarCheck, color: 'accent' },
  ]

  return (
    <div className="container-app py-10">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {profile?.fullName || user?.email}.
          </p>
        </div>
        <Link to="/jobs" className="btn-primary">
          <Search size={16} /> Find Jobs
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-3xl font-extrabold mt-1">
              {loading ? '—' : c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-2">Complete your profile</h2>
          <p className="text-sm text-gray-500 mb-5">
            Employers are more likely to shortlist candidates with complete profiles.
          </p>
          <Link to="/profile/job-seeker" className="btn-outline w-full">
            Edit profile
          </Link>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-2">Track your applications</h2>
          <p className="text-sm text-gray-500 mb-5">
            See your pipeline from Applied → Interview → Hired.
          </p>
          <Link to="/applications" className="btn-outline w-full">
            View applications
          </Link>
        </div>
      </div>
    </div>
  )
}