import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Video,
  User,
  Inbox,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyInterviews } from '../services/interviewService'

function fmt(dateLike) {
  if (!dateLike) return '—'
  const d = dateLike.seconds
    ? new Date(dateLike.seconds * 1000)
    : new Date(dateLike)
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: 'bg-purple-50 text-purple-700 border border-purple-100',
    completed: 'bg-green-50 text-green-700 border border-green-100',
    cancelled: 'bg-red-50 text-red-700 border border-red-100',
    rescheduled: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  }
  return <span className={`badge ${styles[status] || styles.scheduled}`}>{status}</span>
}

const TABS = [
  { v: 'upcoming', l: 'Upcoming' },
  { v: 'past', l: 'Past' },
  { v: 'all', l: 'All' },
]

export default function EmployerInterviews() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const list = await listMyInterviews(user.uid, 'employer')
        if (alive) setItems(list)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const now = Date.now() / 1000
  const upcoming = items.filter(
    (i) =>
      i.status === 'scheduled' &&
      (i.scheduledAt?.seconds || 0) >= now - 3600
  )
  const past = items.filter(
    (i) =>
      i.status !== 'scheduled' ||
      (i.scheduledAt?.seconds || 0) < now - 3600
  )

  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : items

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Interviews</h1>
        <p className="text-gray-500 mt-1">
          {upcoming.length} upcoming · {items.length} total
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => {
          const active = tab === t.v
          return (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                active
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {t.l}
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16">
          <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No interviews here</p>
          <p className="text-sm text-gray-500 mt-1">
            Schedule interviews from an applicant's page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((iv) => (
            <Link key={iv.id} to={`/interviews/${iv.id}`} className="card card-hover block">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{iv.jobTitle}</h3>
                    <StatusBadge status={iv.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-1.5">
                    <User size={13} /> {iv.candidateName || iv.candidateEmail}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {fmt(iv.scheduledAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {iv.durationMin} min
                    </span>
                    {iv.meetingLink && (
                      <span className="inline-flex items-center gap-1 text-brand-700">
                        <Video size={12} /> Has link
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {iv.meetingLink && iv.status === 'scheduled' && (
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <ExternalLink size={14} /> Join
                    </a>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}