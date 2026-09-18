import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Crown,
  ShieldCheck,
  Eye,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getInvite, acceptInvite } from '../services/teamService'
import { friendlyError } from '../utils/errors'

const ROLE_META = {
  owner: { l: 'Owner', icon: Crown },
  recruiter: { l: 'Recruiter', icon: ShieldCheck },
  viewer: { l: 'Viewer', icon: Eye },
}

export default function AcceptInvite() {
  const { token } = useParams()
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const inv = await getInvite(token)
        if (!alive) return
        if (!inv) {
          setError('Invite not found or has been revoked.')
        } else if (inv.status === 'accepted') {
          setError('This invite has already been used.')
        } else if (inv.status === 'revoked') {
          setError('This invite was revoked.')
        } else {
          const exp = inv.expiresAt?.seconds
            ? new Date(inv.expiresAt.seconds * 1000)
            : inv.expiresAt
              ? new Date(inv.expiresAt)
              : null
          if (exp && exp.getTime() < Date.now()) {
            setError('This invite has expired.')
          } else {
            setInvite(inv)
          }
        }
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [token])

  const handleAccept = async () => {
    if (!user) return
    setAccepting(true)
    try {
      await acceptInvite({ token, userId: user.uid })
      await refreshProfile()
      setDone(true)
      setTimeout(() => navigate('/employer/jobs', { replace: true }), 1400)
    } catch (err) {
      setError(friendlyError(err))
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not signed in → ask to sign in / register first
  if (!user) {
    return (
      <div className="container-app py-16 max-w-md">
        <div className="card text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-extrabold">Sign in to accept</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            You need a SkillNest account to accept this team invite. Sign in
            with the email the invite was sent to.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to={`/login?next=/accept-invite/${token}`}
              className="btn-primary"
            >
              Sign in
            </Link>
            <Link
              to={`/register?next=/accept-invite/${token}`}
              className="btn-outline"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-app py-16 max-w-md">
        <div className="card text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <XCircle size={24} />
          </div>
          <h1 className="text-2xl font-extrabold">Invite problem</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{error}</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="container-app py-16 max-w-md">
        <div className="card text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="text-2xl font-extrabold">Welcome to the team</h1>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  const roleMeta = ROLE_META[invite.role] || ROLE_META.viewer
  const RoleIcon = roleMeta.icon
  const emailMatches =
    user.email?.toLowerCase() === invite.invitedEmail?.toLowerCase()

  return (
    <div className="container-app py-16 max-w-lg">
      <div className="card relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Building2 size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">You&apos;re invited to join</p>
              <h1 className="text-xl font-extrabold text-gray-900 truncate">
                {invite.companyName || 'a company'}
              </h1>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 mb-5">
            <div className="flex items-center gap-2">
              <RoleIcon size={14} className="text-brand-700" />
              <span className="text-sm font-semibold text-gray-900">
                Role: {roleMeta.l}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {invite.inviterName
                ? `${invite.inviterName} invited you to help review candidates.`
                : 'You were invited to help review candidates.'}
            </p>
          </div>

          {!emailMatches && (
            <div className="mb-5 flex items-start gap-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Email mismatch</p>
                <p className="text-xs mt-1">
                  This invite was sent to <strong>{invite.invitedEmail}</strong>,
                  but you&apos;re signed in as <strong>{user.email}</strong>.
                  You can still accept — but make sure you want this account
                  linked to the company.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="btn-primary flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Accept invite
                </>
              )}
            </button>
            <Link to="/" className="btn-outline flex-1 text-center">
              Decline
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}