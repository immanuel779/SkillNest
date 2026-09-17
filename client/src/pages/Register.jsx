import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Mail,
  Lock,
  User,
  Briefcase,
  Search,
  AlertCircle,
} from 'lucide-react'
import { friendlyError } from '../utils/errors'

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'job_seeker',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate(`/dashboard/${form.role.replace('_', '-')}`)
    } catch (err) {
      // Never show raw Firebase errors to users
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const roles = [
    {
      id: 'job_seeker',
      label: 'Job Seeker',
      desc: 'Find and apply to jobs',
      icon: Search,
    },
    {
      id: 'employer',
      label: 'Employer',
      desc: 'Post jobs and hire talent',
      icon: Briefcase,
    },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-brand-50 via-white to-accent-50/40">
      <div className="w-full max-w-lg">
        <div className="card">
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join SkillNest in less than a minute.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  className="input pl-10"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="input pl-10"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">I am a...</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => {
                  const active = form.role === r.id
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => update('role', r.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                          : 'border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                          active
                            ? 'bg-brand-gradient text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <r.icon size={16} />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {r.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.desc}
                      </div>
                    </button>
                  )
                })}
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
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{' '}
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