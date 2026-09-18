import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Star,
  Trophy,
  User,
  ExternalLink,
  Info,
  ChevronDown,
} from 'lucide-react'

const SCORE_LABELS = [
  { key: 'technical', label: 'Technical fit' },
  { key: 'culture', label: 'Culture fit' },
  { key: 'communication', label: 'Communication' },
]

const REC_LABELS = {
  strong_yes: { l: 'Strong yes', color: 'text-green-700 bg-green-50 border-green-100' },
  yes: { l: 'Yes', color: 'text-green-700 bg-green-50 border-green-100' },
  maybe: { l: 'Maybe', color: 'text-yellow-700 bg-yellow-50 border-yellow-100' },
  no: { l: 'No', color: 'text-red-700 bg-red-50 border-red-100' },
}

function ScoreStars({ value }) {
  if (typeof value !== 'number' || value < 1) {
    return <span className="text-xs text-gray-400">—</span>
  }
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={
            n <= value ? 'fill-accent-400 text-accent-400' : 'text-gray-200'
          }
        />
      ))}
      <span className="ml-1.5 text-xs font-bold text-gray-800">{value}</span>
    </div>
  )
}

function highestFor(key, candidates) {
  let max = 0
  let winners = []
  candidates.forEach((c) => {
    const v = c.application.scorecard?.[key]
    if (typeof v !== 'number') return
    if (v > max) {
      max = v
      winners = [c.application.id]
    } else if (v === max) {
      winners.push(c.application.id)
    }
  })
  return { max, winners }
}

function highestAvg(candidates) {
  let max = 0
  let winners = []
  candidates.forEach((c) => {
    const v = c.application.scorecardAvg
    if (typeof v !== 'number') return
    if (v > max) {
      max = v
      winners = [c.application.id]
    } else if (v === max) {
      winners.push(c.application.id)
    }
  })
  return { max, winners }
}

export default function CompareScorecards({
  candidates,
  onClose,
  onRemove,
}) {
  const [showNotes, setShowNotes] = useState(true)

  // Pre-compute per-dimension winners
  const tech = useMemo(() => highestFor('technical', candidates), [candidates])
  const culture = useMemo(() => highestFor('culture', candidates), [candidates])
  const comm = useMemo(
    () => highestFor('communication', candidates),
    [candidates]
  )
  const avg = useMemo(() => highestAvg(candidates), [candidates])

  const scoredCount = candidates.filter(
    (c) => c.application.scorecard
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
              <Trophy size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900">
                Compare candidates
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {candidates.length} candidates · {scoredCount} scored
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {candidates.length < 2 ? (
            <div className="text-center py-12 text-gray-500">
              <Info size={28} className="mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium">
                Pick at least 2 candidates to compare
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white text-left font-semibold text-gray-500 uppercase text-[10px] tracking-wide px-3 py-3 border-b border-gray-100 w-40">
                      Metric
                    </th>
                    {candidates.map((c) => {
                      const isWinner = avg.winners.includes(c.application.id)
                      return (
                        <th
                          key={c.application.id}
                          className="text-left px-3 py-3 border-b border-gray-100 align-top min-w-[180px]"
                        >
                          <div className="flex items-start gap-2">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                {c.profile?.photoURL ? (
                                  <img
                                    src={c.profile.photoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  c.profile?.fullName?.[0]?.toUpperCase() ||
                                  '?'
                                )}
                              </div>
                              {isWinner && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 text-white flex items-center justify-center">
                                  <Trophy size={9} />
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">
                                {c.profile?.fullName || 'Candidate'}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {c.profile?.headline || '—'}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Link
                                  to={`/applicants/${c.application.applicantId}`}
                                  className="text-[10px] text-brand-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                                >
                                  View <ExternalLink size={9} />
                                </Link>
                                {onRemove && (
                                  <button
                                    onClick={() => onRemove(c.application.id)}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-semibold"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Overall average row — highlighted */}
                  <tr className="bg-brand-50/40">
                    <td className="sticky left-0 z-10 bg-brand-50/40 px-3 py-3 border-b border-gray-100 font-bold text-gray-900 text-xs">
                      Overall average
                    </td>
                    {candidates.map((c) => {
                      const v = c.application.scorecardAvg
                      const isWinner = avg.winners.includes(c.application.id)
                      return (
                        <td
                          key={c.application.id}
                          className="px-3 py-3 border-b border-gray-100"
                        >
                          {typeof v === 'number' ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-lg font-extrabold ${
                                  isWinner ? 'text-accent-600' : 'text-gray-900'
                                }`}
                              >
                                {v.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400">/ 5</span>
                              {isWinner && (
                                <span className="text-[10px] font-bold text-accent-700 bg-accent-100 rounded px-1.5 py-0.5 ml-1">
                                  Best
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Not scored
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Score rows */}
                  {SCORE_LABELS.map(({ key, label }) => {
                    const winner = { tech, culture, comm }[
                      key === 'technical'
                        ? 'tech'
                        : key === 'culture'
                        ? 'culture'
                        : 'comm'
                    ]
                    return (
                      <tr key={key}>
                        <td className="sticky left-0 z-10 bg-white px-3 py-3 border-b border-gray-100 font-medium text-gray-700 text-xs">
                          {label}
                        </td>
                        {candidates.map((c) => {
                          const v = c.application.scorecard?.[key]
                          const isWinner = winner.winners.includes(
                            c.application.id
                          )
                          return (
                            <td
                              key={c.application.id}
                              className={`px-3 py-3 border-b border-gray-100 ${
                                isWinner && winner.max > 0
                                  ? 'bg-green-50/40'
                                  : ''
                              }`}
                            >
                              <ScoreStars value={v} />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}

                  {/* Recommendation row */}
                  <tr>
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 border-b border-gray-100 font-medium text-gray-700 text-xs">
                      Recommendation
                    </td>
                    {candidates.map((c) => {
                      const rec = c.application.scorecard?.recommendation
                      const meta = rec ? REC_LABELS[rec] : null
                      return (
                        <td
                          key={c.application.id}
                          className="px-3 py-3 border-b border-gray-100"
                        >
                          {meta ? (
                            <span
                              className={`inline-flex items-center text-[11px] font-bold px-2 py-1 rounded border ${meta.color}`}
                            >
                              {meta.l}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Not set
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Notes section */}
          {candidates.length >= 2 && (
            <>
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showNotes ? 'rotate-180' : ''
                  }`}
                />
                {showNotes ? 'Hide' : 'Show'} interview notes
              </button>

              {showNotes && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {candidates.map((c) => {
                    const notes = c.application.scorecard?.notes
                    return (
                      <div
                        key={c.application.id}
                        className="rounded-xl border border-gray-200 p-4 bg-gray-50/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                            {c.profile?.photoURL ? (
                              <img
                                src={c.profile.photoURL}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              c.profile?.fullName?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {c.profile?.fullName || 'Candidate'}
                          </p>
                        </div>
                        {notes ? (
                          <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                            {notes}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No notes yet.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Green highlights mark the strongest score in each row.
          </p>
          <button onClick={onClose} className="btn-primary !py-2 !px-4 text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}