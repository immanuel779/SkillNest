import { useState } from 'react'
import { Send, AlertCircle, X } from 'lucide-react'
import { createUpdate } from '../../services/updateService'
import { notifyCompanyFollowers } from '../../services/notificationService'
import { friendlyError } from '../../utils/errors'

export default function CompanyUpdateComposer({ company, onPosted, onClose }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const remaining = 280 - content.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!content.trim()) {
      setError('Write something first.')
      return
    }
    if (content.length > 280) {
      setError('Update is too long.')
      return
    }

    setSubmitting(true)
    try {
      await createUpdate(company.id, company.ownerId, content)

      // Best-effort: notify followers
      notifyCompanyFollowers(company.id, {
        type: 'company_update',
        title: `📣 ${company.name} posted an update`,
        body: content.slice(0, 100),
        link: `/c/${company.slug}`,
      }).catch(() => {})

      setContent('')
      onPosted?.()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Post an update</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <textarea
        rows={4}
        className="input resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 280))}
        placeholder="Share news, a hiring drive, or a milestone..."
      />

      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs font-medium ${
            remaining < 30 ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {remaining} characters left
        </span>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn-primary !py-2 !px-4 text-sm"
        >
          <Send size={14} />
          {submitting ? 'Posting...' : 'Post update'}
        </button>
      </div>
    </form>
  )
}