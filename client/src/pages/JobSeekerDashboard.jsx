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
import { getProfile } from '../services/profileService'
import ProfileCompletenessCard from '../components/ProfileCompletenessCard'
import { SkeletonStatCard } from '../components/Skeletons'

export default function JobSeekerDashboard() {
  const { user, profile: authProfile } = useAuth()
  const [stats, setStats] = useState({
    applications: 0,
    saved: 0,
    interviews: 0,
    shortlisted: 0,
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const [apps, saved, interviews, profileDoc] = await Promise.all([
          listMyApplications(user.uid),
          listMySavedJobs(user.uid),
          listMyInterviews(user.uid, 'job_seeker'),
          getProfile(user.uid),
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
        setProfile(profileDoc)
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
            Welcome back, {authProfile?.fullName || user?.email}.
          </p>
        </div>
        <Link to="/jobs" className="btn-primary">
          <Search size={16} /> Find Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))
          : cards.map((c) => (
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
                <div className="text-3xl font-extrabold mt-1">{c.value}</div>
              </div>
            ))}
      </div>

      {/* Profile completeness + Track applications */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="card">
            <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200 mb-4" />
            <div className="h-2.5 rounded-full bg-gray-100 mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-md bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        ) : (
          <ProfileCompletenessCard profile={profile} />
        )}

        <div className="card">
          <h2 className="text-lg font-bold mb-2">Track your applications</h2>
          <p className="text-sm text-gray-500 mb-5">
            See your pipeline from Applied → Interview → Hired.
          </p>
          <Link to="/applications" className="btn-outline w-full">
            View applications
          </Link>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Keep the momentum going
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">·</span>
                <span>
                  Save a search from{' '}
                  <Link
                    to="/jobs"
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Find Jobs
                  </Link>{' '}
                  to get alerts when new roles match.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">·</span>
                <span>
                  Follow companies from their space to hear about new roles.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}