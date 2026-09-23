import { useState } from 'react'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmailBanner() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || user.emailVerified) return null

  const resend = async () => {
    setSending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      setSent(true)
      setTimeout(() => setSent(false), 6000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mb-4 flex items-start gap-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">Verify your email to unlock posting</p>
        <p className="text-xs mt-0.5 text-yellow-700">
          We sent a verification link to <strong>{user.email}</strong>. Click it,
          then refresh this page.
        </p>
        {sent && (
          <p className="text-xs mt-1 inline-flex items-center gap-1 text-green-700 font-semibold">
            <CheckCircle2 size={12} /> Verification email sent
          </p>
        )}
      </div>
      <button
        onClick={resend}
        disabled={sending}
        className="text-xs font-semibold text-yellow-900 hover:underline shrink-0 inline-flex items-center gap-1"
      >
        {sending ? <Loader2 size={11} className="animate-spin" /> : null}
        {sending ? 'Sending...' : 'Resend'}
      </button>
    </div>
  )
}