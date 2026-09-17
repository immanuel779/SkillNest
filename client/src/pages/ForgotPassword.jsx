import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../config/firebase'
import { friendlyError } from '../utils/errors'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      })
      setSent(true)
    } catch (err) {
      // Don't reveal whether an email exists — this is intentional
      if (err.code === 'auth/user-not-found') {
        setSent(true)
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-brand-50 via-white to-accent-50/40">
      <div className="w-full max-w-md">
        <div className="card">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={26} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-extrabold">Check your inbox</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                If an account exists for <strong>{email}</strong>, we've sent a
                password reset link. Click the link in the email to choose a
                new password.
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Didn't get the email? Check your spam folder, or{' '}
                <button
                  onClick={() => {
                    setSent(false)
                    setEmail('')
                  }}
                  className="text-brand-700 font-semibold hover:underline"
                >
                  try another email
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">
                Forgot your password?
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter the email you signed up with and we'll send you a reset
                link.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-sm text-gray-500 text-center">
            Remembered it?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}