import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { listPublishedJobs } from '../../services/jobService'
import { scoreCandidateMatch } from '../../services/aiService'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '../../utils/errors'
import {
  getCachedMatch,
  writeMatchCache,
  clearMatchCache,
} from './AIJobMatchBadge'

const TOP_N = 5

export default function AIRecommendedJobs() {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const list = await listPublishedJobs(20)
        if (!alive) return
        const top = list.slice(0, TOP_N)
        setJobs(top)

        const cached = {}
        top.forEach((j) => {
          const c = getCachedMatch(user.uid, j.id)
          if (c) cached[j.id] = c
        })
        setScores(cached)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    if (!user || !profile || jobs.length === 0) return
    const missing = jobs.filter((j) => !scores[j.id])
    if (missing.length === 0) return

    let alive = true
    ;(async () => {
      setScoring(true)
      for (const job of missing) {
        if (!alive) return
        try {
          const text = await scoreCandidateMatch({ job, candidate: profile })
          const m = text.match(/SCORE:\s*(\d+)/i)
          const s = text.match(/SUMMARY:\s*(.+)/i)
          const score = m ? parseInt(m[1], 10) : null
          const summary = s ? s[1].trim() : ''
          writeMatchCache(user.uid, job.id, { score, summary })
          if (!alive) return
          setScores((prev) => ({ ...prev, [job.id]: { score, summary } }))
        } catch (err) {
          setError(friendlyError(err))
          break
        }
      }
      if (alive) setScoring(false)
    })()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, jobs])

  const handleRefresh = () => {
    if (!user) return
    clearMatchCache(user.uid)
    setScores({})
    setError('')
  }

  const sorted = [...jobs].sort((a, b) => {
    const sa = scores[a.id]?.score ?? -1
    const sb = scores[b.id]?.score ?? -1
    return sb - sa
  })

  if (loading) {
    return (
      <div className="card">
        <div className="h-5 w-40 animate-pulse rounded-md bg-gray-200 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (jobs.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold flex items-center gap-2 flex-wrap">
              Recommended for you
              {scoring && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
                  <Loader2 size={9} className="animate-spin" /> Scoring
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              AI-matched to your profile, skills, and experience.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1.5 shrink-0"
          title="Recalculate match scores"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 mb-3">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {sorted.map((job) => {
          const entry = scores[job.id]
          const score = entry?.score
          const color =
            score == null
              ? 'bg-gray-50 text-gray-500 border-gray-200'
              : score >= 75
              ? 'bg-green-50 text-green-700 border-green-200'
              : score >= 50
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'

          return (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="py-3 flex items-center gap-3 hover:bg-gray-50 -mx-3 px-3 rounded-lg transition group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 group-hover:text-brand-700 truncate">
                    {job.title}
                  </p>
                  {score != null ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-md px-1.5 py-0.5 shrink-0 ${color}`}
                      title={entry?.summary || ''}
                    >
                      <Sparkles size={9} />
                      {score}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-md px-1.5 py-0.5 shrink-0">
                      <Loader2 size={9} className="animate-spin" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {job.companyName}
                  {job.location && (
                    <>
                      <span className="mx-1">·</span>
                      <MapPin size={10} className="inline -mt-0.5" />{' '}
                      {job.location}
                    </>
                  )}
                </p>
                {entry?.summary && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    {entry.summary}
                  </p>
                )}
              </div>
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-brand-700 shrink-0"
              />
            </Link>
          )
        })}
      </div>

      <Link
        to="/jobs"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
      >
        Browse all jobs <ArrowRight size={12} />
      </Link>
    </div>
  )
}