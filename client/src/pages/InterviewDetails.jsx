import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  Building2,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getInterview,
  updateInterview,
} from '../services/interviewService'
import { createNotification } from '../services/notificationService'

function fmt(dateLike) {
  if (!dateLike) return '—'
  const d = dateLike.seconds
    ? new Date(dateLike.seconds * 1000)
    : new Date(dateLike)
  return d.toLocaleString([], {
    weekday: 'short',
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

export default function InterviewDetails() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [iv, setIv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const data = await getInterview(id)
      setIv(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const isEmployer = profile?.role === 'employer'
  const isCandidate = profile?.role === 'job_seeker'
  const isOwner = iv?.employerId === user?.uid
  const isParticipant =
    iv && (iv.employerId === user?.uid || iv.candidateId === user?.uid)

  const setStatus = async (status) => {
    if (!iv) return
    setBusy(true)
    try {
      await updateInterview(iv.id, { status })
      const otherId = isEmployer ? iv.candidateId : iv.employerId
      await createNotification({
        userId: otherId,
        type: 'interview',
        title: `Interview ${status}`,
        body: `The interview for "${iv.jobTitle}" was marked ${status}.`,
        link: '/interviews',
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!iv) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">Interview not found</p>
        <Link to="/interviews" className="btn-primary mt-6 inline-flex">
          Back to interviews
        </Link>
      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-gray-600">You don't have access to this interview.</p>
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
              Interview
            </span>
            <StatusBadge status={iv.status} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {iv.jobTitle}
          </h1>
          <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-1.5">
            <Building2 size={14} /> {iv.companyName}
          </p>

          {iv.meetingLink && iv.status === 'scheduled' && (
            <a
              href={iv.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-flex"
            >
              <Video size={16} /> Join Meeting
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4">
            When
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">
                  {fmt(iv.scheduledAt)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">
                  {iv.durationMin} minutes
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4">
            Participants
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 size={16} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Employer</div>
                <div className="font-semibold text-gray-900">
                  {iv.employerName || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Candidate</div>
                <div className="font-semibold text-gray-900">
                  {iv.candidateName || iv.candidateEmail || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {iv.notes && (
        <div className="card mt-6">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-3 flex items-center gap-2">
            <FileText size={14} /> Notes
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {iv.notes}
          </p>
        </div>
      )}

      {iv.status === 'scheduled' && (
        <div className="card mt-6">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-3">
            {isEmployer ? 'Employer actions' : 'Actions'}
          </h2>
          <div className="flex flex-wrap gap-3">
            {isEmployer || isCandidate ? (
              <>
                <button
                  onClick={() => setStatus('completed')}
                  disabled={busy}
                  className="btn-outline !text-green-700 !border-green-200"
                >
                  <CheckCircle2 size={16} /> Mark as completed
                </button>
                <button
                  onClick={() => setStatus('cancelled')}
                  disabled={busy}
                  className="btn-outline !text-red-600 !border-red-200"
                >
                  <XCircle size={16} /> Cancel interview
                </button>
                {isOwner && (
                  <button
                    onClick={() =>
                      navigate(`/employer/applications/${iv.applicationId}/interview`)
                    }
                    disabled={busy}
                    className="btn-outline"
                  >
                    Reschedule
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}