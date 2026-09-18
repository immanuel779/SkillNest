import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { scoreCandidateMatch } from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

export default function SmartCandidateMatching({
  job,
  candidate,
  autoRun = false,
}) {
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(null)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    if (!job || !candidate) return
    setLoading(true)
    setError('')
    try {
      const text = await scoreCandidateMatch({ job, candidate })
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
      const summaryMatch = text.match(/SUMMARY:\s*(.+)/i)
      const parsedScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null
      setScore(parsedScore)
      setSummary(summaryMatch ? summaryMatch[1].trim() : '')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoRun && !score && !loading) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  const color =
    score == null
      ? 'gray'
      : score >= 75
      ? 'green'
      : score >= 50
      ? 'yellow'
      : 'red'

  const colorClasses = {
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-purple-50 border border-purple-100 rounded-lg px-2.5 py-1.5">
        <Loader2 size={11} className="animate-spin text-purple-600" />
        AI matching…
      </div>
    )
  }

  if (error) {
    return (
      <button
        onClick={run}
        className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5"
      >
        <AlertCircle size={11} /> Retry match
      </button>
    )
  }

  if (score == null) {
    return (
      <button
        onClick={run}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition"
        title="AI match score"
      >
        <Sparkles size={11} /> Match
      </button>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold border rounded-lg px-2.5 py-1.5 ${colorClasses[color]}`}
      title={summary}
    >
      <Sparkles size={11} />
      {score}% match
    </span>
  )
}