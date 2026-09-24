import { useEffect } from 'react'
import { X, ExternalLink, Check } from 'lucide-react'

const ICONS = {
  new_application: '📩',
  application_status: '📊',
  message: '💬',
  interview: '📅',
  admin_new_application: '📥',
  admin_status_change: '📊',
  admin_new_job: '💼',
  admin_new_user: '👤',
  new_job: '🔔',
  company_update: '📣',
  platform_announcement: '📢',
  system: '🔔',
}

export default function NotificationDetailModal({
  notification,
  onClose,
  onOpenLink,
}) {
  // Close on Escape
  useEffect(() => {
    if (!notification) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [notification, onClose])

  if (!notification) return null

  const n = notification
  const icon = ICONS[n.type] || '🔔'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notification detail"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="text-2xl shrink-0 leading-none mt-0.5">{icon}</div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                {n.type?.replace(/_/g, ' ') || 'Notification'}
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5 break-words">
                {n.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {n.body ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
              {n.body}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No additional details.
            </p>
          )}

          {n.createdAt?.seconds && (
            <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
              {new Date(n.createdAt.seconds * 1000).toLocaleString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="btn-outline !py-2 !px-4 text-sm"
          >
            <Check size={14} /> Got it
          </button>
          {n.link && (
            <button
              onClick={() => {
                onClose()
                onOpenLink?.(n.link)
              }}
              className="btn-primary !py-2 !px-4 text-sm"
            >
              <ExternalLink size={14} /> Open
            </button>
          )}
        </div>
      </div>
    </div>
  )
}