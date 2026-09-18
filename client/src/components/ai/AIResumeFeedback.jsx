import { useState } from 'react'
import { Sparkles, X, Loader2, AlertCircle } from 'lucide-react'
import { generateResumeFeedback } from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

export default function AIResumeFeedback({
  resumeText,
  profile,
  open,
  onClose,
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!resumeText?.trim()) {
      setError('No resume text to analyze.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const text = await generateResumeFeedback({
        resumeText,
        targetRole: profile?.headline,
        candidateHeadline: profile?.headline,
      })
      setResult(text)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles size={16} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Resume Feedback</h2>
              <p className="text-xs text-gray-500">
                Honest, actionable review of your resume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result && !loading && !error && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 mb-6">
                We'll review your resume against your target role and give you
                specific, honest feedback.
              </p>
              <button onClick={handleGenerate} className="btn-primary">
                <Sparkles size={16} /> Analyze my resume
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2
                size={32}
                className="mx-auto text-purple-600 animate-spin mb-3"
              />
              <p className="text-sm text-gray-500">
                Analyzing your resume…
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
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-4">
              {result}
            </pre>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          {result && (
            <button onClick={handleGenerate} className="btn-outline">
              Regenerate
            </button>
          )}
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}