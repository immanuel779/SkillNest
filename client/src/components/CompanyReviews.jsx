import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Trash2,
  PenLine,
  Loader2,
} from 'lucide-react'
import {
  listCompanyReviews,
  getReviewStats,
  deleteReview,
  replyToReview,
} from '../services/reviewService'
import { friendlyError } from '../utils/errors'

function Stars({ value, size = 14 }) {
  const rounded = Math.round(value)
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= rounded
              ? 'fill-accent-400 text-accent-400'
              : 'text-gray-200'
          }
        />
      ))}
    </div>
  )
}

function RatingBreakdown({ distribution, total }) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((n) => {
        const count = distribution[n] || 0
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-gray-500">{n}</span>
            <Star size={11} className="fill-accent-400 text-accent-400" />
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-accent-400 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-gray-500">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function relativeTime(ts) {
  if (!ts?.seconds) return ''
  const diff = Date.now() - ts.seconds * 1000
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}mo ago`
  return `${Math.floor(m / 12)}y ago`
}

export default function CompanyReviews({
  companyId,
  companyOwnerId,
  currentUserId,
  canRespond = false,
  onCountChange,
}) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ count: 0, average: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [list, s] = await Promise.all([
        listCompanyReviews(companyId),
        getReviewStats(companyId),
      ])
      setReviews(list)
      setStats(s)
      onCountChange?.(list.length)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteReview(id)
      await load()
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  const handleReply = async (id) => {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await replyToReview(id, replyText.trim())
      setReplyTo(null)
      setReplyText('')
      await load()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setReplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="card text-center py-16">
        <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Candidates who interviewed can leave an anonymous review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="card">
        <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-center">
          <div className="text-center sm:text-left">
            <div className="text-5xl font-extrabold text-gray-900">
              {stats.average.toFixed(1)}
            </div>
            <div className="mt-1">
              <Stars value={stats.average} size={18} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on {stats.count}{' '}
              {stats.count === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          <RatingBreakdown
            distribution={stats.distribution}
            total={stats.count}
          />
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((r) => {
          const isAuthor = r.authorId === currentUserId
          const canDelete = isAuthor || canRespond
          return (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Anonymous avatar */}
                  <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        Anonymous
                      </span>
                      <Stars value={r.rating} size={12} />
                    </div>
                    {r.interviewedRole && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Interviewed for {r.interviewedRole}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400">
                    {relativeTime(r.createdAt)}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-300 hover:text-red-600 transition p-1"
                      aria-label="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {r.title && (
                <h3 className="mt-3 font-bold text-gray-900">{r.title}</h3>
              )}
              {r.body && (
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {r.body}
                </p>
              )}

              {/* Employer reply */}
              {r.employerReply ? (
                <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700 mb-1">
                    Response from the company
                  </p>
                  <p className="text-sm text-brand-900 whitespace-pre-line">
                    {r.employerReply}
                  </p>
                </div>
              ) : canRespond ? (
                replyTo === r.id ? (
                  <div className="mt-4">
                    <textarea
                      rows={3}
                      className="input resize-none"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a public reply..."
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setReplyTo(null)
                          setReplyText('')
                        }}
                        className="btn-outline !py-1.5 !px-3 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(r.id)}
                        disabled={replying || !replyText.trim()}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        {replying ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />{' '}
                            Posting...
                          </>
                        ) : (
                          'Post reply'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyTo(r.id)}
                    className="mt-3 text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                  >
                    <PenLine size={11} /> Reply publicly
                  </button>
                )
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}