import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Calendar,
  Send,
  Eye,
  Trophy,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getApplication } from '../services/applicationService'
import { getJob } from '../services/jobService'
import { friendlyError } from '../utils/errors'

const STAGE_META = {
  applied: {
    label: 'Applied',
    icon: Send,
    color: 'blue',
    blurb: 'Your application was submitted.',
  },
  under_review: {
    label: 'Under review',
    icon: Eye,
    color: 'yellow',
    blurb: 'The employer is reviewing your application.',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: Star,
    color: 'green',
    blurb: 'You made the shortlist.',
  },
  interview: {
    label: 'Interview',
    icon: Calendar,
    color: 'purple',
    blurb: 'You reached the interview stage.',
  },
  hired: {
    label: 'Hired',
    icon: Trophy,
    color: 'brand',
    blurb: 'Congratulations — you were hired!',
  },
  rejected: {
    label: 'Not selected',
    icon: XCircle,
    color: 'red',
    blurb: 'The employer moved forward with other candidates.',
  },
}

const COLOR_BG = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  red: 'bg-red-50 text-red-700 border-red-200',
}
const COLOR_DOT = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  brand: 'bg-brand-500',
  red: 'bg-red-500',
}
const COLOR_RING = {
  blue: 'ring-blue-100',
  yellow: 'ring-yellow-100',
  green: 'ring-green-100',
  purple: 'ring-purple-100',
  brand: 'ring-brand-100',
  red: 'ring-red-100',
}

function formatDate(ts, { withTime = false } = {}) {
  if (!ts) return '—'
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  const opts = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  if (withTime) {
    opts.hour = '2-digit'
    opts.minute = '2-digit'
  }
  return d.toLocaleString(undefined, opts)
}

function relativeTime(ts) {
  if (!ts) return ''
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function ApplicationTimeline() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [app, setApp] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const a = await getApplication(id)
        if (!alive) return
        if (!a) {
          setError('Application not found.')
          setLoading(false)
          return
        }
        if (a.applicantId !== user?.uid) {
          setError("You don't have access to this application.")
          setLoading(false)
          return
        }
        setApp(a)

        try {
          const j = await getJob(a.jobId)
          if (alive) setJob(j)
        } catch {
          /* job may have been deleted */
        }
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="container-app py-16 text-center max-w-md">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">
          {error || 'Application not found'}
        </p>
        <Link to="/applications" className="btn-primary mt-6 inline-flex">
          Back to applications
        </Link>
      </div>
    )
  }

  const history = Array.isArray(app.statusHistory) ? app.statusHistory : []
  // Guarantee at least the initial 'applied' entry
  const timeline =
    history.length > 0
      ? history
      : [{ status: 'applied', at: app.createdAt, by: 'candidate' }]

  const current = STAGE_META[app.status] || STAGE_META.applied
  const CurrentIcon = current.icon

  return (
    <div className="container-app py-10 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`badge ${COLOR_BG[current.color]} inline-flex items-center gap-1`}
                >
                  <CurrentIcon size={12} />
                  {current.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {app.jobTitle}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {app.companyName && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} /> {app.companyName}
                  </span>
                )}
                {job?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} /> {job.location}
                  </span>
                )}
                {app.createdAt?.seconds && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} />
                    Applied {formatDate(app.createdAt)}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                {current.blurb}
              </p>
            </div>
          </div>

          {job && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/jobs/${job.id}`} className="btn-outline !py-2 !px-3 text-sm">
                <Briefcase size={14} /> View job
              </Link>
              {job.companyId && (
                <Link
                  to={`/companies/${job.companyId}`}
                  className="btn-outline !py-2 !px-3 text-sm"
                >
                  <Building2 size={14} /> View company
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="text-lg font-bold mb-1">Application timeline</h2>
        <p className="text-sm text-gray-500 mb-6">
          Every status change, from application to decision.
        </p>

        <ol className="relative">
          {timeline.map((entry, i) => {
            const meta = STAGE_META[entry.status] || STAGE_META.applied
            const Icon = meta.icon
            const isLast = i === timeline.length - 1
            const isCurrent = entry.status === app.status && isLast

            return (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Vertical line */}
                {!isLast && (
                  <span
                    className="absolute left-4 top-10 bottom-0 w-px bg-gray-200"
                    aria-hidden
                  />
                )}

                {/* Dot */}
                <div
                  className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ${COLOR_RING[meta.color]} ${COLOR_DOT[meta.color]} text-white`}
                >
                  <Icon size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {meta.label}
                    </span>
                    {isCurrent && (
                      <span className="badge bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-bold">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(entry.at, { withTime: true })}
                    {entry.at && (
                      <span className="text-gray-400">
                        {' '}
                        · {relativeTime(entry.at)}
                      </span>
                    )}
                  </p>
                  {entry.note && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">
                      {entry.note}
                    </p>
                  )}
                  {entry.by && (
                    <p className="text-[11px] text-gray-400 mt-1 capitalize">
                      by {entry.by}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Application details */}
      <div className="card mt-6">
        <h2 className="text-lg font-bold mb-4">What you submitted</h2>

        {app.coverLetter && (
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              Cover letter
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {app.coverLetter}
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {app.resumeUrl && (
            <a
              href={app.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Resume</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {app.resumeName || 'View file'}
                </p>
              </div>
            </a>
          )}

          {Array.isArray(app.attachments) &&
            app.attachments.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-brand-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Attachment</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {a.name || 'View file'}
                  </p>
                </div>
              </a>
            ))}
        </div>

        {!app.coverLetter &&
          !app.resumeUrl &&
          (!app.attachments || app.attachments.length === 0) && (
            <p className="text-sm text-gray-500">
              No additional documents were submitted with this application.
            </p>
          )}
      </div>

      {/* Encouragement / next steps */}
      <div className="card mt-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <h2 className="text-lg font-bold mb-2">
          {app.status === 'hired'
            ? "You're hired! 🎉"
            : app.status === 'rejected'
            ? 'Keep going'
            : 'What happens next?'}
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {app.status === 'hired'
            ? "The employer has marked you as hired. They'll reach out with next steps."
            : app.status === 'rejected'
            ? "Every application is a step forward. Keep applying — the right role is out there."
            : 'The employer will review your application and update the status here. You will get a notification and email when something changes.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/jobs" className="btn-primary !py-2 !px-4 text-sm">
            Browse more jobs
          </Link>
          <Link to="/applications" className="btn-outline !py-2 !px-4 text-sm">
            All applications
          </Link>
        </div>
      </div>
    </div>
  )
}