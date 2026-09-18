import { useState } from 'react'
import {
  Star,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { createReview } from '../services/reviewService'
import { friendlyError } from '../utils/errors'

export default function ReviewModal({
  company,
  userId,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [interviewedRole, setInterviewedRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (rating < 1) {
      setError('Please pick a rating.')
      return
    }
    if (body.trim().length < 20) {
      setError('Please write at least 20 characters about your experience.')
      return
    }

    setSubmitting(true)
    try {
      await createReview({
        companyId: company.id,
        companyOwnerId: company.ownerId,
        authorId: userId,
        rating,
        title,
        body,
        interviewedRole,
      })
      setDone(true)
      setTimeout(() => {
        onSubmitted?.()
        onClose?.()
      }, 1200)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
              <Star size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900">
                Review {company.name}
              </h2>
              <p className="text-xs text-gray-500">
                Posted anonymously · only the company and admins see your ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-600 mb-3" />
            <p className="font-semibold text-gray-900">Review submitted</p>
            <p className="text-sm text-gray-500 mt-1">
              Thank you for helping the community.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="label">Your overall rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-1 transition hover:scale-110"
                      aria-label={`${n} star`}
                    >
                      <Star
                        size={30}
                        className={
                          (hover || rating) >= n
                            ? 'fill-accent-400 text-accent-400'
                            : 'text-gray-200'
                        }
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-bold text-gray-800">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Role you interviewed for</label>
                <input
                  className="input"
                  value={interviewedRole}
                  onChange={(e) => setInterviewedRole(e.target.value.slice(0, 120))}
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="label">Headline</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  placeholder="e.g. Great culture, slow process"
                />
              </div>

              <div>
                <label className="label">Your experience</label>
                <textarea
                  rows={6}
                  className="input resize-none"
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 2000))}
                  placeholder="What was the interview process like? What stood out?"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">
                    Minimum 20 characters
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {body.length} / 2000
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 flex items-start gap-2 text-xs text-brand-800">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                <p>
                  Your review will be posted anonymously. Employers cannot see
                  your name, email, or profile — only the review content.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating < 1}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Star size={14} /> Post review
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}