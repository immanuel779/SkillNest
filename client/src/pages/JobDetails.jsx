import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Send,
  X,
  MessageSquare,
  AlertCircle,
  Flag,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getJob } from '../services/jobService'
import { hasApplied, createApplication } from '../services/applicationService'
import { isJobSaved, saveJob, unsaveJob } from '../services/savedJobService'
import { ensureConversation } from '../services/messageService'
import ReportModal from '../components/ReportModal'

export default function JobDetails() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const j = await getJob(id)
        if (!alive) return
        setJob(j)

        if (user && j && profile?.role === 'job_seeker') {
          const [a, s] = await Promise.all([
            hasApplied(user.uid, id),
            isJobSaved(user.uid, id),
          ])
          if (alive) {
            setApplied(a)
            setSaved(s)
          }
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, user, profile?.role])

  const toggleSave = async () => {
    if (!user || profile?.role !== 'job_seeker') return
    try {
      if (saved) await unsaveJob(user.uid, id)
      else await saveJob(user.uid, id)
      setSaved(!saved)
    } catch {
      /* silent */
    }
  }

  const messageEmployer = async () => {
    if (!user || profile?.role !== 'job_seeker' || !job) return
    try {
      const convId = await ensureConversation({
        employerId: job.ownerId,
        candidateId: user.uid,
        jobId: job.id,
        jobTitle: job.title,
      })
      navigate(`/messages?c=${convId}`)
    } catch (err) {
      console.error('Failed to start conversation:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-gray-600">Job not found.</p>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex">
          Back to jobs
        </Link>
      </div>
    )
  }

  const isJobSeeker = profile?.role === 'job_seeker'
  const isOwner = user?.uid === job.ownerId

  return (
    <div className="container-app py-10 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
                  {job.jobType?.replace('_', ' ')}
                </span>
                <span className="badge bg-gray-100 text-gray-600">
                  {job.workMode}
                </span>
                <span className="badge bg-gray-100 text-gray-600">
                  {job.experienceLevel} level
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">{job.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
               <Link
  to={`/companies/${job.companyId}`}
  className="inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors"
>
  <Building2 size={14} /> {job.companyName}
</Link>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {job.location || '—'}
                </span>
                {(job.salaryMin || job.salaryMax) && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                    <DollarSign size={14} /> {job.currency || 'USD'}{' '}
                    {job.salaryMin?.toLocaleString?.() || '—'} –{' '}
                    {job.salaryMax?.toLocaleString?.() || '—'}
                  </span>
                )}
                {job.applicationDeadline && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> Apply by {job.applicationDeadline}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isJobSeeker && (
            <div className="mt-6 flex flex-wrap gap-3">
              {applied ? (
                <button
                  disabled
                  className="btn-outline !text-green-700 !border-green-200"
                >
                  <CheckCircle2 size={16} /> Applied
                </button>
              ) : (
                <button
                  onClick={() => setShowApply(true)}
                  className="btn-primary"
                >
                  <Send size={16} /> Apply Now
                </button>
              )}
              <button onClick={toggleSave} className="btn-outline">
                {saved ? (
                  <>
                    <BookmarkCheck size={16} className="text-brand-700" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={16} /> Save
                  </>
                )}
              </button>
              <button onClick={messageEmployer} className="btn-outline">
                <MessageSquare size={16} /> Message Employer
              </button>
            </div>
          )}

          {isOwner && (
            <div className="mt-6 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              You posted this job. Manage it from{' '}
              <Link
                to="/employer/jobs"
                className="text-brand-700 font-semibold hover:underline"
              >
                My Jobs
              </Link>
              .
            </div>
          )}

          {!user && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">
                Sign in to apply
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Section title="About the role">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </Section>

          {job.responsibilities && (
            <Section title="Responsibilities">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.responsibilities}
              </p>
            </Section>
          )}

          {job.requirements && (
            <Section title="Requirements">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.requirements}
              </p>
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          {job.skills?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-brand-50 text-brand-700 border border-brand-100 rounded-md px-2 py-1 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
              At a glance
            </h3>
            <dl className="space-y-3 text-sm">
              <Row label="Type" value={job.jobType?.replace('_', ' ')} />
              <Row label="Mode" value={job.workMode} />
              <Row label="Level" value={job.experienceLevel} />
              <Row label="Location" value={job.location || '—'} />
              {job.category && <Row label="Category" value={job.category} />}
            </dl>
          </div>
        </aside>
      </div>

      {/* Report link */}
      {user && !isOwner && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-400 hover:text-red-600 inline-flex items-center gap-1 transition"
          >
            <Flag size={11} />
            Report this job
          </button>
        </div>
      )}

      {showApply && (
        <ApplyModal
          job={job}
          user={user}
          profile={profile}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setApplied(true)
            setShowApply(false)
          }}
        />
      )}

      {showReport && (
        <ReportModal
          targetType="job"
          targetId={job.id}
          targetLabel={job.title}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right capitalize">{value}</dd>
    </div>
  )
}

function ApplyModal({ job, user, profile, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeUrl] = useState(profile?.resumeUrl || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!resumeUrl) {
      setError('Please add a resume to your profile before applying.')
      return
    }
    setSubmitting(true)
    try {
      await createApplication(user.uid, user.email, job, {
        coverLetter,
        resumeUrl,
        resumeName: profile?.resumeName || '',
      })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">Apply to {job.title}</h2>
            <p className="text-sm text-gray-500">{job.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">Resume</label>
            {resumeUrl ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50">
                <span className="text-sm truncate">
                  {profile?.resumeName || 'Resume.pdf'}
                </span>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-700 hover:underline shrink-0 ml-3"
                >
                  View
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No resume on file. Add one from your{' '}
                <Link
                  to="/profile/job-seeker"
                  className="text-brand-700 font-semibold"
                >
                  profile
                </Link>{' '}
                first.
              </p>
            )}
          </div>

          <div>
            <label className="label">Cover letter (optional)</label>
            <textarea
              rows={6}
              className="input resize-none"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Why are you a great fit for this role?"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            <Send size={16} />{' '}
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </div>
      </div>
    </div>
  )
}