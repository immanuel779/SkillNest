import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Download,
  MessageSquare,
  CalendarPlus,
  MessageCircle,
  User,
  LayoutGrid,
  List,
  Star,
  Paperclip,
  ExternalLink,
  GitCompare,
  Square,
  CheckSquare,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getJob } from '../services/jobService'
import {
  listApplicationsForJob,
  updateApplicationStatus,
  getApplicantProfile,
} from '../services/applicationService'
import { ensureConversation } from '../services/messageService'
import { openWhatsApp } from '../utils/whatsapp'
import { friendlyError } from '../utils/errors'
import { SkeletonList } from '../components/Skeletons'
import KanbanBoard from '../components/kanban/KanbanBoard'
import ScorecardModal from '../components/ScorecardModal'
import CompareScorecards from '../components/CompareScorecards'
import SmartCandidateMatching from '../components/ai/SmartCandidateMatching'

const PIPELINE = [
  { v: 'all', l: 'All' },
  { v: 'applied', l: 'Applied' },
  { v: 'under_review', l: 'Under Review' },
  { v: 'shortlisted', l: 'Shortlisted' },
  { v: 'interview', l: 'Interview' },
  { v: 'hired', l: 'Hired' },
  { v: 'rejected', l: 'Rejected' },
]

const STATUS_OPTIONS = [
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

function ScoreBadge({ score }) {
  if (typeof score !== 'number') return null
  const color =
    score >= 4
      ? 'bg-green-50 text-green-700 border-green-100'
      : score >= 3
      ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
      : 'bg-red-50 text-red-700 border-red-100'
  return (
    <span
      className={`badge ${color} inline-flex items-center gap-1 font-bold`}
      title="Internal scorecard average"
    >
      <Star size={10} className="fill-current" />
      {score.toFixed(1)}
    </span>
  )
}

export default function EmployerJobApplicants() {
  const { id: jobId } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [apps, setApps] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [scoreTarget, setScoreTarget] = useState(null)

  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [showCompare, setShowCompare] = useState(false)

  const load = async () => {
    if (!user) return
    try {
      const j = await getJob(jobId)
      if (!j || j.ownerId !== user.uid) {
        setError("This job doesn't belong to your account.")
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
    setApps((list) =>
      list.map((a) => (a.id === app.id ? { ...a, status } : a))
    )
    try {
      await updateApplicationStatus(app.id, status)
      toast.success(
        `Moved to ${status.replace('_', ' ')}`,
        'The candidate has been notified.'
      )
      await load()
    } catch (err) {
      setApps((list) =>
        list.map((a) => (a.id === app.id ? { ...a, status: app.status } : a))
      )
      toast.error('Could not update', friendlyError(err))
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
      toast.error('Could not open conversation', friendlyError(err))
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

  const filtered =
    filter === 'all' ? apps : apps.filter((a) => a.status === filter)

  const toggleSelect = (app) => {
    setSelected((list) => {
      if (list.includes(app.id)) return list.filter((x) => x !== app.id)
      if (list.length >= 4) {
        toast.info('You can compare up to 4 candidates')
        return list
      }
      return [...list, app.id]
    })
  }

  const compareCandidates = useMemo(
    () =>
      selected
        .map((id) => {
          const application = apps.find((a) => a.id === id)
          if (!application) return null
          return {
            application,
            profile: profiles[application.applicantId] || {},
          }
        })
        .filter(Boolean),
    [selected, apps, profiles]
  )

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200 mb-2" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
        </div>
        <SkeletonList count={3} />
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

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Applicants</h1>
          <p className="text-gray-500">
            {job?.title} · {apps.length} total
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!compareMode && apps.length >= 2 && (
            <button
              onClick={() => {
                setCompareMode(true)
                setView('list')
                setSelected([])
              }}
              className="btn-outline"
            >
              <GitCompare size={14} /> Compare
            </button>
          )}

          {compareMode && (
            <>
              <span className="text-xs font-semibold text-gray-600 hidden sm:inline">
                {selected.length} / 4 selected
              </span>
              <button
                onClick={() => setShowCompare(true)}
                disabled={selected.length < 2}
                className="btn-primary disabled:opacity-50"
              >
                <GitCompare size={14} /> Compare ({selected.length})
              </button>
              <button
                onClick={() => {
                  setCompareMode(false)
                  setSelected([])
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </>
          )}

          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => {
                setView('board')
                setCompareMode(false)
                setSelected([])
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                view === 'board'
                  ? 'bg-brand-700 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid size={13} /> Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                view === 'list'
                  ? 'bg-brand-700 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List size={13} /> List
            </button>
          </div>
        </div>
      </div>

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

      {view === 'board' && (
        <>
          {apps.length === 0 ? (
            <div className="card text-center py-16">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">No applicants yet</p>
              <p className="text-sm text-gray-500 mt-1">
                When candidates apply, they&apos;ll show up here.
              </p>
            </div>
          ) : (
            <KanbanBoard
              apps={apps}
              profiles={profiles}
              onStatusChange={setStatus}
              busyId={busyId}
            />
          )}
        </>
      )}

      {view === 'list' && (
        <>
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
              <p className="font-semibold text-gray-700">No applicants here</p>
              <p className="text-sm text-gray-500 mt-1">
                Try a different filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((a) => {
                const p = profiles[a.applicantId] || {}
                const busy = busyId === a.id
                const attachments = a.attachments || []
                const isSelected = selected.includes(a.id)

                return (
                  <div
                    key={a.id}
                    className={`card transition ${
                      compareMode && isSelected
                        ? 'ring-2 ring-brand-500 border-brand-300'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {compareMode && (
                          <button
                            onClick={() => toggleSelect(a)}
                            className="shrink-0 mt-1 text-brand-700 hover:text-brand-800 transition"
                            aria-label={
                              isSelected ? 'Deselect' : 'Select for comparison'
                            }
                          >
                            {isSelected ? (
                              <CheckSquare size={22} />
                            ) : (
                              <Square size={22} className="text-gray-300" />
                            )}
                          </button>
                        )}

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
                            <ScoreBadge score={a.scorecardAvg} />
                            <SmartCandidateMatching job={job} candidate={p} />
                          </div>
                          <p className="text-sm text-brand-700 font-medium">
                            {p.headline || '—'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {p.location || ''}
                            {p.phone && (
                              <span className="ml-2">· {p.phone}</span>
                            )}
                          </p>

                          {p.skills && p.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {p.skills.slice(0, 6).map((s) => {
                                const label =
                                  typeof s === 'string' ? s : s.name
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

                          {attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                <Paperclip size={11} /> Attachments:
                              </span>
                              {attachments.map((at) => (
                                <a
                                  key={at.url}
                                  href={at.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5 hover:bg-brand-100 transition"
                                >
                                  {at.name?.slice(0, 22) || 'File'}
                                  <ExternalLink size={9} />
                                </a>
                              ))}
                            </div>
                          )}

                          {a.coverLetter && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                              {a.coverLetter}
                            </p>
                          )}
                        </div>
                      </div>

                      {!compareMode && (
                        <div className="flex flex-wrap md:flex-col gap-2 md:w-56 shrink-0">
                          <Link
                            to={`/applicants/${a.applicantId}`}
                            className="btn-outline !py-2 !px-3 text-sm"
                          >
                            <User size={14} /> View Profile
                          </Link>

                          <button
                            onClick={() => setScoreTarget(a)}
                            className="btn-outline !py-2 !px-3 text-sm !text-accent-600 !border-accent-200"
                          >
                            <Star size={14} />{' '}
                            {a.scorecardAvg ? 'Edit scorecard' : 'Score'}
                          </button>

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

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1 px-1">
                              Status
                            </label>
                            <div className="relative">
                              <select
                                value={a.status}
                                disabled={busy}
                                onChange={(e) => {
                                  const next = e.target.value
                                  if (next !== a.status) setStatus(a, next)
                                }}
                                className="w-full appearance-none rounded-lg border border-brand-300 bg-white px-3 py-2 pr-8 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.v} value={s.v}>
                                    {s.l}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-700"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => scheduleInterview(a)}
                            disabled={busy}
                            className="btn-outline !py-2 !px-3 text-sm !text-purple-700 !border-purple-200"
                          >
                            <CalendarPlus size={14} /> Schedule
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {scoreTarget && (
        <ScorecardModal
          applicationId={scoreTarget.id}
          candidateName={
            profiles[scoreTarget.applicantId]?.fullName || 'Candidate'
          }
          existing={scoreTarget.scorecard}
          onClose={() => setScoreTarget(null)}
          onSaved={() => {
            toast.success('Scorecard saved')
            load()
          }}
        />
      )}

      {showCompare && (
        <CompareScorecards
          candidates={compareCandidates}
          onClose={() => setShowCompare(false)}
          onRemove={(id) =>
            setSelected((list) => list.filter((x) => x !== id))
          }
        />
      )}
    </div>
  )
}