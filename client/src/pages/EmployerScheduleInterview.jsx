import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Clock,
  FileText,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { createInterview } from '../services/interviewService'

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EmployerScheduleInterview() {
  const { id: applicationId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    scheduledAt: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
    durationMin: 30,
    meetingLink: '',
    notes: '',
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'applications', applicationId))
        if (!alive) return
        if (!snap.exists()) {
          setError('Application not found')
          return
        }
        const data = { id: snap.id, ...snap.data() }
        if (data.employerId !== user.uid) {
          setError('Not your application')
          return
        }
        setApp(data)
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, applicationId])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.scheduledAt) {
      setError('Please choose a date and time')
      return
    }
    const when = new Date(form.scheduledAt)
    if (when.getTime() < Date.now() - 60 * 1000) {
      setError('The interview date must be in the future')
      return
    }

    setSaving(true)
    try {
      await createInterview(app, {
        uid: user.uid,
        fullName: profile?.fullName,
        email: user.email,
      }, {
        scheduledAt: when,
        durationMin: form.durationMin,
        meetingLink: form.meetingLink,
        notes: form.notes,
      })
      setDone(true)
      setTimeout(() => navigate(`/employer/applications/${applicationId}/interview`), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <CalendarPlus size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Schedule Interview</h1>
            {app && (
              <p className="text-sm text-gray-500">
                {app.jobTitle} · {app.applicantEmail}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done && (
          <div className="mb-5 flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>Interview scheduled. Notifying the candidate...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Date & time *</label>
            <input
              type="datetime-local"
              className="input"
              value={form.scheduledAt}
              onChange={(e) => update('scheduledAt', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">
              <Clock size={14} className="inline mr-1" /> Duration (minutes)
            </label>
            <select
              className="input"
              value={form.durationMin}
              onChange={(e) => update('durationMin', Number(e.target.value))}
            >
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <LinkIcon size={14} className="inline mr-1" /> Meeting link
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://meet.google.com/..."
              value={form.meetingLink}
              onChange={(e) => update('meetingLink', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Google Meet, Zoom, Teams, or any other link. Optional but recommended.
            </p>
          </div>

          <div>
            <label className="label">
              <FileText size={14} className="inline mr-1" /> Notes for the candidate
            </label>
            <textarea
              rows={4}
              className="input resize-none"
              placeholder="What to prepare, who they'll meet, what to expect..."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <CalendarPlus size={16} />
              {saving ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}