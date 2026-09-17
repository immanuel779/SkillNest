import { useState } from 'react'
import { Flag, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createReport, REPORT_REASONS } from '../services/reportService'

export default function ReportModal({
  targetType,
  targetId,
  targetLabel,
  onClose,
}) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!reason) {
      setError('Please choose a reason')
      return
    }
    if (!user) {
      setError('You must be signed in to submit a report')
      return
    }
    setSubmitting(true)
    try {
      await createReport({
        reporterId: user.uid,
        targetType,
        targetId,
        reason,
        details,
      })
      setDone(true)
      setTimeout(() => onClose?.(), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Flag size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Report</h2>
              {targetLabel && (
                <p className="text-xs text-gray-500 truncate max-w-[220px]">
                  {targetLabel}
                </p>
              )}
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
            <CheckCircle2 size={36} className="mx-auto text-green-600 mb-3" />
            <p className="font-semibold text-gray-900">Report submitted</p>
            <p className="text-sm text-gray-500 mt-1">
              Our team will review this shortly. Thank you.
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label">Reason</label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                        reason === r
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="accent-brand-600"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {r}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Details (optional)</label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us more about the issue..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="btn-primary !bg-red-600 hover:!bg-red-700"
              >
                <Flag size={14} />
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}