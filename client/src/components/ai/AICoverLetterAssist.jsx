import { useState } from 'react'
import { Sparkles, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { generateCoverLetter } from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

const TONES = [
  { v: 'professional', l: 'Professional' },
  { v: 'friendly', l: 'Friendly' },
  { v: 'enthusiastic', l: 'Enthusiastic' },
  { v: 'concise', l: 'Concise' },
]

export default function AICoverLetterAssist({ job, profile, onInsert }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [tone, setTone] = useState('professional')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const text = await generateCoverLetter({
        jobTitle: job?.title,
        companyName: job?.companyName,
        jobDescription: job?.description,
        candidateName: profile?.fullName,
        candidateHeadline: profile?.headline,
        candidateSkills: (profile?.skills || []).map((s) =>
          typeof s === 'string' ? s : s.name
        ),
        candidateExperience: profile?.bio || profile?.summary || '',
        tone,
      })
      setResult(text)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    if (!result) handleGenerate()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition"
      >
        <Sparkles size={12} /> Write with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Cover Letter</h2>
                  <p className="text-xs text-gray-500">
                    Personalized for {job?.title} at {job?.companyName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 border-b border-gray-100">
              <label className="label !mb-1.5">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => setTone(t.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      tone === t.v
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading && (
                <div className="text-center py-12">
                  <Loader2
                    size={32}
                    className="mx-auto text-purple-600 animate-spin mb-3"
                  />
                  <p className="text-sm text-gray-500">
                    Writing your cover letter…
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={handleGenerate}
                    className="text-xs font-semibold underline shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {result && !loading && (
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-gray-200 p-4 text-sm leading-relaxed resize-none focus:border-purple-500 focus:outline-none"
                />
              )}
            </div>

            <div className="flex justify-between items-center gap-3 p-5 border-t border-gray-100">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-sm font-medium text-purple-700 hover:text-purple-800 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onInsert?.(result)
                    setOpen(false)
                    setResult('')
                  }}
                  disabled={!result || loading}
                  className="btn-primary disabled:opacity-50"
                >
                  <Sparkles size={14} /> Use this letter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}