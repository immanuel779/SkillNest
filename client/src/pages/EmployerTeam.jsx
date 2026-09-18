import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  Users,
  Mail,
  Crown,
  ShieldCheck,
  Eye,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getMyCompany,
  listTeamMembers,
  removeTeamMember,
  updateTeamRole,
} from '../services/companyService'
import { inviteTeamMember, revokeInvite } from '../services/teamService'
import { friendlyError } from '../utils/errors'

const ROLES = [
  {
    v: 'recruiter',
    l: 'Recruiter',
    icon: ShieldCheck,
    blurb:
      'Can post jobs, review applicants, message candidates, and schedule interviews.',
  },
  {
    v: 'viewer',
    l: 'Viewer',
    icon: Eye,
    blurb: 'Can view applicants and job posts. Cannot change anything.',
  },
]

const ROLE_LABEL = {
  owner: 'Owner',
  recruiter: 'Recruiter',
  viewer: 'Viewer',
}

const ROLE_BADGE = {
  owner: 'bg-brand-100 text-brand-800',
  recruiter: 'bg-blue-50 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
}

const ROLE_ICON = {
  owner: Crown,
  recruiter: ShieldCheck,
  viewer: Eye,
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function EmployerTeam() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()

  const [company, setCompany] = useState(null)
  const [members, setMembers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('recruiter')
  const [sending, setSending] = useState(false)

  const [busyId, setBusyId] = useState(null)

  // Treat anyone who owns the company as owner even if the flag is missing
  const isOwner =
    profile?.teamRole === 'owner' ||
    (company && user && company.ownerId === user.uid)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      // getMyCompany self-heals the user doc — call it FIRST
      const c = await getMyCompany(user.uid)
      setCompany(c)

      if (c) {
        // Refresh the auth profile so isOwner reflects the healed role
        try {
          await refreshProfile()
        } catch {
          /* best-effort */
        }

        const list = await listTeamMembers(c.id)
        setMembers(list)

        // Pending invites for this company
        try {
          const snap = await getDocs(
            query(
              collection(db, 'teamInvites'),
              where('companyId', '==', c.id),
              where('status', '==', 'pending')
            )
          )
          setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        } catch {
          setPending([])
        }
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Enter an email address')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Enter a valid email address')
      return
    }
    setSending(true)
    try {
      await inviteTeamMember({
        companyId: company.id,
        companyName: company.name,
        invitedBy: user.uid,
        inviterName: profile?.fullName || user.email,
        invitedEmail: inviteEmail.trim(),
        role: inviteRole,
      })
      toast.success('Invite sent', 'Check the inbox to confirm delivery.')
      setShowInvite(false)
      setInviteEmail('')
      setInviteRole('recruiter')
      await load()
    } catch (err) {
      toast.error('Could not send invite', friendlyError(err))
    } finally {
      setSending(false)
    }
  }

  const handleRevoke = async (invite) => {
    if (!window.confirm(`Revoke invite to ${invite.invitedEmail}?`)) return
    setBusyId(invite.id)
    try {
      await revokeInvite(invite.id)
      toast.success('Invite revoked')
      await load()
    } catch (err) {
      toast.error('Could not revoke', friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleRemoveMember = async (member) => {
    if (member.teamRole === 'owner') {
      toast.error('Cannot remove the owner')
      return
    }
    if (
      !window.confirm(
        `Remove ${member.fullName || member.email} from your team?`
      )
    ) {
      return
    }
    setBusyId(member.id)
    try {
      await removeTeamMember(member.id)
      toast.success('Member removed')
      await load()
    } catch (err) {
      toast.error('Could not remove', friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleChangeRole = async (member, newRole) => {
    if (member.teamRole === 'owner') return
    setBusyId(member.id)
    try {
      await updateTeamRole(member.id, newRole)
      toast.success('Role updated')
      await load()
    } catch (err) {
      toast.error('Could not update role', friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container-app py-16 max-w-2xl">
        <div className="card text-center">
          <h2 className="text-xl font-bold">
            Create your company profile first
          </h2>
          <p className="text-gray-500 mt-2">
            You need a company before you can invite team members.
          </p>
          <Link
            to="/employer/company"
            className="btn-primary mt-6 inline-flex"
          >
            Create company profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-3xl">
      <Link
        to="/employer/jobs"
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Users size={26} className="text-brand-600" />
            Team
          </h1>
          <p className="text-gray-500 mt-1">
            Invite teammates to help review candidates on {company.name}.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary"
          >
            <UserPlus size={16} /> Invite member
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isOwner && (
        <div className="card mb-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Info size={16} className="text-brand-600 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="font-semibold text-gray-900">
                What each role can do
              </p>
              <ul className="space-y-1 text-gray-600">
                <li>
                  · <strong>Owner</strong> — full access, including billing and
                  team management.
                </li>
                <li>
                  · <strong>Recruiter</strong> — post jobs, review applicants,
                  message candidates, schedule interviews.
                </li>
                <li>
                  · <strong>Viewer</strong> — read-only. Great for HR partners
                  or leadership.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card !p-0 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold">Members ({members.length})</h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No members yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((m) => {
              const RoleIcon = ROLE_ICON[m.teamRole] || Users
              const busy = busyId === m.id
              const isSelf = m.id === user.uid

              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      m.fullName?.[0]?.toUpperCase() ||
                      m.email?.[0]?.toUpperCase() ||
                      '?'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">
                        {m.fullName || m.email}
                        {isSelf && (
                          <span className="ml-2 text-[10px] text-gray-400">
                            (you)
                          </span>
                        )}
                      </p>
                      <span
                        className={`badge ${ROLE_BADGE[m.teamRole] || 'bg-gray-100 text-gray-700'} inline-flex items-center gap-1 text-[10px]`}
                      >
                        <RoleIcon size={10} />
                        {ROLE_LABEL[m.teamRole] || 'Member'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5 inline-flex items-center gap-1">
                      <Mail size={11} /> {m.email}
                    </p>
                  </div>

                  {isOwner && m.teamRole !== 'owner' && !isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.teamRole || 'viewer'}
                        onChange={(e) => handleChangeRole(m, e.target.value)}
                        disabled={busy}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-brand-400"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m)}
                        disabled={busy}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        aria-label="Remove"
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold">Pending invites ({pending.length})</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Invites expire after 7 days.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {pending.map((inv) => {
              const RoleIcon = ROLE_ICON[inv.role] || Users
              const busy = busyId === inv.id
              return (
                <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {inv.invitedEmail}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
                      <RoleIcon size={10} />
                      {ROLE_LABEL[inv.role] || inv.role}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRevoke(inv)}
                      disabled={busy}
                      className="btn-outline !py-1.5 !px-3 text-xs !text-red-600 !border-red-200 shrink-0"
                    >
                      {busy ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Invite a team member
                  </h3>
                  <p className="text-xs text-gray-500">
                    We&apos;ll email them an invite link.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Their email">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    className="input pl-10"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  />
                </div>
              </Field>

              <div>
                <label className="label">Role</label>
                <div className="space-y-2">
                  {ROLES.map((r) => {
                    const active = inviteRole === r.v
                    const Icon = r.icon
                    return (
                      <button
                        key={r.v}
                        type="button"
                        onClick={() => setInviteRole(r.v)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition ${
                          active
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-brand-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            size={14}
                            className={
                              active ? 'text-brand-700' : 'text-gray-500'
                            }
                          />
                          <span className="font-semibold text-sm text-gray-900">
                            {r.l}
                          </span>
                          {active && (
                            <CheckCircle2
                              size={14}
                              className="text-brand-600 ml-auto"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-5">
                          {r.blurb}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowInvite(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sending || !inviteEmail.trim()}
                className="btn-primary"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Send invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}