import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  Download,
  MessageSquare,
  CalendarPlus,
  MessageCircle,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getJob } from '../services/jobService'
import {
  listApplicationsForJob,
  updateApplicationStatus,
  getApplicantProfile,
} from '../services/applicationService'
import { ensureConversation } from '../services/messageService'
import { openWhatsApp } from '../utils/whatsapp'
import { friendlyError } from '../utils/errors'

const PIPELINE = [
  { v: 'all', l: 'All' },
  { v: 'applied', l: 'Applied' },
  { v: 'under_review', l: 'Under Review' },
  { v: 'shortlisted', l: 'Shortlisted' },
  { v: 'interview', l: 'Interview' },
  { v: 'hired', l: 'Hired' },
  { v: 'rejected', l: 'Rejected' },
]

function AppStatus({ status }) {
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

export default function EmployerJobApplicants() {
  const { id: jobId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [apps, setApps] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    if (!user) return
    try {
      const j = await getJob(jobId)
      if (!j || j.ownerId !== user.uid) {
        setError('This job doesn\'t belong to your account.')
        return
      }
      setJob(j)

      const list = await listApplicationsForJob(jobId, user.uid)
      setApps(list)

      const p = {}
      await Promise.all(
        list.map(async (a) => {
          try {
            p[a.applicantId] = await getApplicantProfile(a.applicantId)
          } catch {
            p[a.applicantId] = null
          }
        })
      )
      setProfiles(p)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jobId])

  const setStatus = async (app, status) => {
    setBusyId(app.id)
    try {
      await updateApplicationStatus(app.id, status)
      await load()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const messageApplicant = async (app) => {
    if (!user || !job) return
    setBusyId(app.id)
    try {
      const convId = await ensureConversation({
        employerId: user.uid,
        candidateId: app.applicantId,
        jobId: app.jobId,
        jobTitle: app.jobTitle || job.title,
        employerName: job.companyName,
        candidateName: profiles[app.applicantId]?.fullName || '',
        candidateEmail: app.applicantEmail,
      })
      navigate(`/messages?c=${convId}`)
    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const messageWhatsApp = (app) => {
    const p = profiles[app.applicantId] || {}
    const text = `Hi ${p.fullName || 'there'}, this is ${
      job?.companyName || 'the hiring team'
    } regarding your application for "${job?.title}".`

    if (!p.phone) {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, '_blank', 'noopener')
      return
    }

    openWhatsApp(p.phone, text)
  }

  const scheduleInterview = (app) => {
    navigate(`/employer/applications/${app.id}/interview`)
  }

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <button
        onClick={() => navigate('/employer/jobs')}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Back to jobs
      </button>

      <h1 className="text-3xl font-extrabold mb-1">Applicants</h1>
      <p className="text-gray-500 mb-8">
        {job?.title} · {apps.length} total
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {PIPELINE.map((p) => {
          const count =
            p.v === 'all'
              ? apps.length
              : apps.filter((a) => a.status === p.v).length
          const active = filter === p.v
          return (
            <button
              key={p.v}
              onClick={() => setFilter(p.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                active
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {p.l} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No applicants yet</p>
          <p className="text-sm text-gray-500 mt-1">
            When candidates apply, they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((a) => {
            const p = profiles[a.applicantId] || {}
            const busy = busyId === a.id
            return (
              <div key={a.id} className="card">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {p.photoURL ? (
                        <img
                          src={p.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        p.fullName?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/applicants/${a.applicantId}`}
                          className="font-bold text-gray-900 hover:text-brand-700 hover:underline"
                        >
                          {p.fullName || 'Candidate'}
                        </Link>
                        <AppStatus status={a.status} />
                      </div>
                      <p className="text-sm text-brand-700 font-medium">
                        {p.headline || '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.location || ''}
                        {p.phone && <span className="ml-2">· {p.phone}</span>}
                      </p>

                      {p.skills && p.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.skills.slice(0, 6).map((s) => {
                            const label = typeof s === 'string' ? s : s.name
                            return (
                              <span
                                key={label}
                                className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 rounded-md px-2 py-0.5"
                              >
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {a.coverLetter && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                          {a.coverLetter}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-2 md:w-56 shrink-0">
                    <Link
                      to={`/applicants/${a.applicantId}`}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <User size={14} /> View Profile
                    </Link>
                    {(a.resumeUrl || p.resumeUrl) && (
                      <a
                        href={a.resumeUrl || p.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline !py-2 !px-3 text-sm"
                      >
                        <Download size={14} /> Resume
                      </a>
                    )}
                    <button
                      onClick={() => messageApplicant(a)}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    <button
                      onClick={() => messageWhatsApp(a)}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-green-700 !border-green-200"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button
                      onClick={() => setStatus(a, 'shortlisted')}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-green-700 !border-green-200"
                    >
                      <CheckCircle2 size={14} /> Shortlist
                    </button>
                    <button
                      onClick={() => scheduleInterview(a)}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-purple-700 !border-purple-200"
                    >
                      <CalendarPlus size={14} /> Schedule
                    </button>
                    <button
                      onClick={() => setStatus(a, 'hired')}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-brand-700"
                    >
                      Hire
                    </button>
                    <button
                      onClick={() => setStatus(a, 'rejected')}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-red-600 !border-red-200"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}