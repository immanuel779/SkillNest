import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyApplications } from '../services/applicationService'
import { SkeletonList } from '../components/Skeletons'
import { friendlyError } from '../utils/errors'

const STAGES = [
  { v: 'all', l: 'All' },
  { v: 'applied', l: 'Applied' },
  { v: 'under_review', l: 'Under Review' },
  { v: 'shortlisted', l: 'Shortlisted' },
  { v: 'interview', l: 'Interview' },
  { v: 'hired', l: 'Hired' },
  { v: 'rejected', l: 'Rejected' },
]

function StatusBadge({ status }) {
  const styles = {
    applied: 'bg-blue-50 text-blue-700 border border-blue-100',
    under_review: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    shortlisted: 'bg-green-50 text-green-700 border border-green-100',
    interview: 'bg-purple-50 text-purple-700 border border-purple-100',
    hired: 'bg-brand-100 text-brand-800',
    rejected: 'bg-red-50 text-red-700 border border-red-100',
  }
  return (
    <span className={`badge ${styles[status] || styles.applied}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function MyApplications() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const list = await listMyApplications(user.uid)
        if (alive) setApps(list)
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

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter)

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">My Applications</h1>
        <p className="text-gray-500 mt-1">
          {loading
            ? 'Loading...'
            : 'Tap any application to see the full timeline.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {STAGES.map((s) => {
            const count =
              s.v === 'all'
                ? apps.length
                : apps.filter((a) => a.status === s.v).length
            const active = filter === s.v
            return (
              <button
                key={s.v}
                onClick={() => setFilter(s.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  active
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {s.l} <span className="opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">
            {apps.length === 0
              ? 'No applications yet'
              : 'No applications in this stage'}
          </p>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {apps.length === 0
              ? 'Browse jobs and apply to get started.'
              : 'Try a different filter.'}
          </p>
          <Link to="/jobs" className="btn-primary inline-flex">
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((a) => {
            const stages = a.statusHistory?.length || 1
            return (
              <Link
                key={a.id}
                to={`/applications/${a.id}`}
                className="card card-hover block group"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                        {a.jobTitle}
                      </h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} /> {a.companyName}
                      </span>
                      {a.createdAt?.seconds && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          Applied{' '}
                          {new Date(
                            a.createdAt.seconds * 1000
                          ).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {stages} {stages === 1 ? 'stage' : 'stages'}
                      </span>
                    </div>
                    {a.coverLetter && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {a.coverLetter}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                    View timeline
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}