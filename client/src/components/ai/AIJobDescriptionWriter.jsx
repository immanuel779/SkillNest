import { useState } from 'react'
import { Sparkles, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { generateJobDescription } from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

export default function AIJobDescriptionWriter({ formData, onInsert }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!formData?.title?.trim()) {
      setError('Add a job title first.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const text = await generateJobDescription(formData)
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

  const handleInsert = () => {
    onInsert?.(result)
    setOpen(false)
    setResult('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition shrink-0"
      >
        <Sparkles size={12} /> Write with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-purple-700" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold truncate">
                    AI Job Description
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                    Generated from your job details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 shrink-0 p-1"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loading && (
                <div className="text-center py-12">
                  <Loader2
                    size={32}
                    className="mx-auto text-purple-600 animate-spin mb-3"
                  />
                  <p className="text-sm text-gray-500">
                    Writing your job description…
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="flex-1 break-words">{error}</span>
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
                  className="w-full rounded-xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed font-mono resize-none focus:border-purple-500 focus:outline-none"
                />
              )}
            </div>

            {/* FOOTER — responsive, wraps on mobile */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-5 border-t border-gray-100 shrink-0">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs sm:text-sm font-medium text-purple-700 hover:text-purple-800 inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={14} /> Regenerate
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setOpen(false)}
                  className="btn-outline !py-2 !px-3 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsert}
                  disabled={!result || loading}
                  className="btn-primary !py-2 !px-3 text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">Insert into description</span>
                  <span className="sm:hidden">Insert</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}