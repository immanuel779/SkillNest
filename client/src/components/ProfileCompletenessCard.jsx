import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import {
  computeProfileCompleteness,
  scoreLabel,
} from '../utils/profileCompleteness'

const BAR_COLORS = {
  green: 'from-green-500 to-emerald-500',
  brand: 'from-brand-500 to-brand-700',
  yellow: 'from-yellow-400 to-amber-500',
  red: 'from-red-500 to-rose-500',
}

export default function ProfileCompletenessCard({ profile }) {
  const [expanded, setExpanded] = useState(false)

  const { score, items, missing } = useMemo(
    () => computeProfileCompleteness(profile),
    [profile]
  )
  const status = scoreLabel(score)
  const topMissing = missing.slice(0, 3)

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-300/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">
                Profile strength
              </h2>
              <p className="text-xs text-gray-500">
                {status.label} · {score} / 100
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              status.color === 'green'
                ? 'bg-green-50 text-green-700'
                : status.color === 'brand'
                ? 'bg-brand-50 text-brand-700'
                : status.color === 'yellow'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {score}%
          </span>
        </div>

        <div className="mt-4">
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${BAR_COLORS[status.color]} rounded-full transition-all duration-700`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {missing.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Next steps
            </p>
            <ul className="space-y-2">
              {topMissing.map((it) => (
                <li key={it.id} className="flex items-start gap-2 text-sm">
                  <Circle
                    size={8}
                    className="text-gray-300 mt-1.5 shrink-0 fill-current"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{it.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{it.hint}</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded shrink-0">
                    +{it.weight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p className="font-medium">
              Your profile is complete. You&apos;re ready to apply.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
          >
            {expanded ? (
              <>
                Hide checklist <ChevronUp size={12} />
              </>
            ) : (
              <>
                View full checklist <ChevronDown size={12} />
              </>
            )}
          </button>
        )}

        {expanded && (
          <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-2 text-sm">
                {it.done ? (
                  <CheckCircle2
                    size={14}
                    className="text-green-600 shrink-0"
                  />
                ) : (
                  <Circle size={14} className="text-gray-300 shrink-0" />
                )}
                <span
                  className={
                    it.done
                      ? 'text-gray-500 line-through'
                      : 'text-gray-800 font-medium'
                  }
                >
                  {it.label}
                </span>
                <span className="ml-auto text-[10px] text-gray-400">
                  {it.weight} pts
                </span>
              </li>
            ))}
          </ul>
        )}

        {score < 100 && (
          <Link to="/profile/job-seeker" className="btn-primary w-full mt-5">
            Complete your profile
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}