import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ShieldAlert, LifeBuoy } from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { friendlyError } from '../utils/errors'

const ROUTES = {
  admin: '/admin',
  employer: '/dashboard/employer',
  job_seeker: '/dashboard/job-seeker',
}

const SUPPORT_EMAIL = 'opeyemioluwadamilare415@gmail.com'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, logout, suspendedNotice, clearSuspendedNotice } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (suspendedNotice) {
      setError('Your account has been suspended.')
      clearSuspendedNotice()
    }
  }, [suspendedNotice, clearSuspendedNotice])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const cred = await login(email, password)
      const uid = cred.user.uid
      const userEmail = cred.user.email || email

      let snap = await getDoc(doc(db, 'users', uid))

      // ─── AUTO-HEAL: create missing user doc on first login ───
      if (!snap.exists()) {
        const newDoc = {
          uid,
          email: userEmail,
          fullName: cred.user.displayName || userEmail.split('@')[0],
          role: 'job_seeker', // default; user can change later in settings
          photoURL: cred.user.photoURL || '',
          isSuspended: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        await setDoc(doc(db, 'users', uid), newDoc)
        snap = await getDoc(doc(db, 'users', uid))
      }

      const data = snap.data()

      if (data.isSuspended === true) {
        await logout()
        setError('Your account has been suspended.')
        return
      }

      const role = (data.role || 'job_seeker').toString().trim().toLowerCase()
      const dest = ROUTES[role] || '/dashboard/job-seeker'
      navigate(dest, { replace: true })
    } catch (err) {
      // Never show raw Firebase errors to users
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const suspended = error.toLowerCase().includes('suspended')

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
              <div
                className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
                  suspended
                    ? 'text-red-700 bg-red-50 border border-red-200'
                    : 'text-red-600 bg-red-50 border border-red-100'
                }`}
              >
                {suspended ? (
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {suspended && (
                    <p className="text-xs mt-1 text-red-600/90">
                      If you think this is a mistake, contact support and we'll
                      review your account.
                    </p>
                  )}
                </div>
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

          {suspended && (
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Suspended%20SkillNest%20account%20appeal`}
              className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg py-2.5 hover:bg-red-100 transition"
            >
              <LifeBuoy size={14} />
              Contact support
            </a>
          )}

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