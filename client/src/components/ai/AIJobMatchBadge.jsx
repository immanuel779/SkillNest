import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { scoreCandidateMatch } from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const cacheKey = (uid) => `skillnest_jobMatches_${uid}`

export function readMatchCache(uid) {
  if (!uid) return {}
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

export function getCachedMatch(uid, jobId) {
  if (!uid || !jobId) return null
  const cache = readMatchCache(uid)
  const entry = cache[jobId]
  if (!entry) return null
  if (Date.now() - (entry.at || 0) > CACHE_TTL_MS) return null
  return entry
}

export function writeMatchCache(uid, jobId, entry) {
  if (!uid || !jobId) return
  try {
    const cache = readMatchCache(uid)
    cache[jobId] = { ...entry, at: Date.now() }
    localStorage.setItem(cacheKey(uid), JSON.stringify(cache))
  } catch {
    /* silent */
  }
}

export function clearMatchCache(uid) {
  try {
    localStorage.removeItem(cacheKey(uid))
  } catch {
    /* silent */
  }
}

export default function AIJobMatchBadge({
  job,
  candidate,
  autoRun = false,
  compact = false,
}) {
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(null)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!candidate?.uid || !job?.id) return
    const cached = getCachedMatch(candidate.uid, job.id)
    if (cached) {
      setScore(cached.score ?? null)
      setSummary(cached.summary || '')
    }
  }, [candidate?.uid, job?.id])

  const run = async () => {
    if (!job || !candidate) return
    setLoading(true)
    setError('')
    try {
      const text = await scoreCandidateMatch({ job, candidate })
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
      const summaryMatch = text.match(/SUMMARY:\s*(.+)/i)
      const parsed = scoreMatch ? parseInt(scoreMatch[1], 10) : null
      const sum = summaryMatch ? summaryMatch[1].trim() : ''
      setScore(parsed)
      setSummary(sum)
      writeMatchCache(candidate.uid, job.id, { score: parsed, summary: sum })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoRun && score == null && !loading && !error) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-purple-50 border border-purple-100 rounded-md px-2 py-1">
        <Loader2 size={10} className="animate-spin text-purple-600" />
        Scoring…
      </span>
    )
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          run()
        }}
        className="inline-flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1"
      >
        <AlertCircle size={10} /> Retry
      </button>
    )
  }

  if (score == null) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          run()
        }}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md px-2 py-1 transition"
        title="Score this job against your profile"
      >
        <Sparkles size={10} />
        {compact ? 'Match' : 'AI Match'}
      </button>
    )
  }

  const color =
    score >= 75
      ? 'bg-green-50 text-green-700 border-green-200'
      : score >= 50
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-red-50 text-red-700 border-red-200'

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-md px-2 py-1 ${color}`}
      title={summary || 'AI match score'}
    >
      <Sparkles size={10} />
      {score}%
    </span>
  )
}