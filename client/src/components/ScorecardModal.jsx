import { useState } from 'react'
import {
  Star,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
} from 'lucide-react'
import { saveScorecard } from '../services/applicationService'
import { friendlyError } from '../utils/errors'

const RECOMMENDATIONS = [
  { v: 'strong_yes', l: 'Strong yes', color: 'green', icon: ThumbsUp },
  { v: 'yes', l: 'Yes', color: 'green', icon: ThumbsUp },
  { v: 'maybe', l: 'Maybe', color: 'yellow', icon: MinusCircle },
  { v: 'no', l: 'No', color: 'red', icon: ThumbsDown },
]

function ScoreRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value >= n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition hover:bg-gray-100"
              aria-label={`${n} of 5`}
            >
              <Star
                size={18}
                className={
                  active
                    ? 'fill-accent-400 text-accent-400'
                    : 'text-gray-300'
                }
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ScorecardModal({
  applicationId,
  candidateName,
  existing,
  onClose,
  onSaved,
}) {
  const [technical, setTechnical] = useState(existing?.technical ?? 0)
  const [culture, setCulture] = useState(existing?.culture ?? 0)
  const [communication, setCommunication] = useState(existing?.communication ?? 0)
  const [recommendation, setRecommendation] = useState(existing?.recommendation ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const overallAvg =
    [technical, culture, communication].filter((n) => n > 0).length > 0
      ? (
          [technical, culture, communication]
            .filter((n) => n > 0)
            .reduce((a, b) => a + b, 0) /
          [technical, culture, communication].filter((n) => n > 0).length
        ).toFixed(1)
      : null

  const handleSubmit = async () => {
    setError('')
    if (technical === 0 && culture === 0 && communication === 0) {
      setError('Give at least one score.')
      return
    }
    setSaving(true)
    try {
      await saveScorecard(applicationId, {
        technical: technical || null,
        culture: culture || null,
        communication: communication || null,
        recommendation,
        notes,
      })
      setDone(true)
      setTimeout(() => {
        onSaved?.()
        onClose?.()
      }, 900)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
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
              <h2 className="font-bold text-gray-900">Scorecard</h2>
              <p className="text-xs text-gray-500 truncate">
                {candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2
              size={40}
              className="mx-auto text-green-600 mb-3"
            />
            <p className="font-semibold text-gray-900">Scorecard saved</p>
            <p className="text-sm text-gray-500 mt-1">
              Only you can see this.
            </p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 px-4">
                <ScoreRow
                  label="Technical fit"
                  value={technical}
                  onChange={setTechnical}
                />
                <ScoreRow
                  label="Culture fit"
                  value={culture}
                  onChange={setCulture}
                />
                <ScoreRow
                  label="Communication"
                  value={communication}
                  onChange={setCommunication}
                />
              </div>

              {overallAvg && (
                <div className="text-center text-sm text-gray-500">
                  Overall average:{' '}
                  <span className="font-bold text-accent-600">
                    {overallAvg} / 5
                  </span>
                </div>
              )}

              <div>
                <label className="label">Recommendation</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RECOMMENDATIONS.map((r) => {
                    const active = recommendation === r.v
                    return (
                      <button
                        key={r.v}
                        type="button"
                        onClick={() =>
                          setRecommendation(active ? '' : r.v)
                        }
                        className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition text-center ${
                          active
                            ? r.color === 'green'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : r.color === 'yellow'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {r.l}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">
                  Notes (only you can see these)
                </label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
                  placeholder="Highlights from the interview, concerns, follow-up questions..."
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {notes.length} / 2000
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Star size={14} /> Save scorecard
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