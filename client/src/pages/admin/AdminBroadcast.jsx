import { useState } from 'react'
import {
  Megaphone,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { notifyAllUsers } from '../../services/notificationService'
import { friendlyError } from '../../utils/errors'

const ROLES = [
  { v: '', l: 'Everyone' },
  { v: 'job_seeker', l: 'Job seekers only' },
  { v: 'employer', l: 'Employers only' },
]

export default function AdminBroadcast() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [role, setRole] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const handleSend = async () => {
    setError('')
    setSuccess(null)

    if (!title.trim()) {
      setError('Give the announcement a title.')
      return
    }
    if (!body.trim()) {
      setError('Write the announcement body.')
      return
    }

    const roleLabel =
      ROLES.find((r) => r.v === role)?.l.toLowerCase() || 'all users'
    if (
      !window.confirm(
        `Send this announcement to ${roleLabel}?\n\nTitle: ${title}\n\nThis cannot be undone.`
      )
    ) {
      return
    }

    setSending(true)
    try {
      const result = await notifyAllUsers({
        title,
        body,
        link,
        type: 'platform_announcement',
        role: role || null,
      })
      setSuccess(result.sent)
      setTitle('')
      setBody('')
      setLink('')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone size={22} className="text-brand-600" />
          Platform broadcast
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Send an in-app notification to every user. Use sparingly — only for
          major platform announcements.
        </p>
      </div>

      <div className="card space-y-5">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success != null && (
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">
              Broadcast sent to <strong>{success}</strong>{' '}
              {success === 1 ? 'user' : 'users'}.
            </span>
          </div>
        )}

        <div>
          <label className="label">Audience</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  role === r.v
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {r.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 🎉 New AI features are live"
            maxLength={120}
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/120</p>
        </div>

        <div>
          <label className="label">Body</label>
          <textarea
            rows={6}
            className="input resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Keep it short and clear."
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/500</p>
        </div>

        <div>
          <label className="label">Link (optional)</label>
          <input
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/jobs or /dashboard/job-seeker"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={16} /> Send broadcast
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}