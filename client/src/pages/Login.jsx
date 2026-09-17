import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { auth, db } from '../config/firebase'

const ROUTES = {
  admin: '/admin',
  employer: '/dashboard/employer',
  job_seeker: '/dashboard/job-seeker',
}

function friendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please check and try again.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been suspended. Please contact support.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.'
    default:
      return 'Could not sign in. Please try again.'
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)

      // Read role directly from Firestore
      const uid = auth.currentUser?.uid
      let role = 'job_seeker'
      if (uid) {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) {
          const raw = (snap.data().role || 'job_seeker')
            .toString()
            .trim()
            .toLowerCase()
          role = raw
        }
      }

      // Look up known route; fall back to job seeker dashboard
      const dest = ROUTES[role] || '/dashboard/job-seeker'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err?.code))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-brand-50 via-white to-accent-50/40">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your SkillNest account.
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
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
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
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Get Started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}