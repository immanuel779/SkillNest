import { useState } from 'react'
import { Copy, Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, mine, onCopy }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
          mine
            ? 'bg-brand-700 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>

        <div
          className={`flex items-center gap-1 text-[10px] mt-1 ${
            mine ? 'text-white/60 justify-end' : 'text-gray-400'
          }`}
        >
          {message.createdAt?.seconds && (
            <span>
              {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {mine && (
            message.isRead ? (
              <CheckCheck size={12} className="text-white/80" />
            ) : (
              <Check size={12} className="text-white/60" />
            )
          )}
        </div>

        {/* Copy action on hover */}
        <button
          onClick={handleCopy}
          className={`absolute -top-2 ${
            mine ? '-left-2' : '-right-2'
          } w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center`}
          aria-label="Copy message"
        >
          {copied ? (
            <Check size={11} className="text-green-600" />
          ) : (
            <Copy size={11} className="text-gray-600" />
          )}
        </button>
      </div>
    </div>
  )
}