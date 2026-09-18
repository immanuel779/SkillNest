import { Zap } from 'lucide-react'

const EMPLOYER_REPLIES = [
  {
    label: 'Thanks for applying',
    text: "Thanks for applying to this role. We've received your application and will review it shortly.",
  },
  {
    label: 'Request a call',
    text: "I'd love to schedule a quick call to learn more about your experience. What time works for you this week?",
  },
  {
    label: 'Shortlisting',
    text: "Good news — you've been shortlisted! We'll be in touch with next steps shortly.",
  },
  {
    label: 'Interview invite',
    text: "We'd like to invite you to an interview. I'll send over the details in a moment.",
  },
  {
    label: 'Need more info',
    text: "Could you share a bit more about your experience with this role's core requirements?",
  },
  {
    label: 'Position filled',
    text: "Thank you for your interest. This position has been filled, but we'll keep your profile for future openings.",
  },
]

const CANDIDATE_REPLIES = [
  {
    label: 'Thank you',
    text: "Thank you for the update — I really appreciate it.",
  },
  {
    label: 'Available for a call',
    text: "I'm available for a call. Please let me know what time works best for you.",
  },
  {
    label: 'Confirm interest',
    text: "I'm very interested in this role and would love to move forward.",
  },
  {
    label: 'Share availability',
    text: "Here's my availability this week — happy to work around your schedule.",
  },
  {
    label: 'Request details',
    text: "Could you share a bit more about the role and next steps?",
  },
]

export default function QuickReplies({ role, onPick, onClose }) {
  const replies = role === 'employer' ? EMPLOYER_REPLIES : CANDIDATE_REPLIES

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-accent-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Quick replies
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xs"
        >
          ✕
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {replies.map((r) => (
          <button
            key={r.label}
            onClick={() => {
              onPick(r.text)
              onClose()
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-brand-50 border-b border-gray-50 last:border-b-0 transition"
          >
            <p className="text-xs font-bold text-gray-900">{r.label}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {r.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}