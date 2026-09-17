import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  KeyRound,
  Mail,
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  X,
  Loader2,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  deleteUser,
} from 'firebase/auth'
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../utils/errors'

function Section({ title, subtitle, children }) {
  return (
    <div className="card mb-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

function Toast({ type, message, onClose }) {
  const isError = type === 'error'
  return (
    <div
      className={`mb-6 flex items-start gap-2 text-sm rounded-lg p-3 ${
        isError
          ? 'text-red-600 bg-red-50 border border-red-100'
          : 'text-green-700 bg-green-50 border border-green-100'
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className={`shrink-0 ${isError ? 'text-red-500' : 'text-green-600'}`}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function AccountSettings() {
  const { user, profile, refreshProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [toast, setToast] = useState(null)
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ============================
  // Password change
  // ============================
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwBusy, setPwBusy] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      showToast('error', 'Please fill in all password fields.')
      return
    }
    if (pwForm.next.length < 6) {
      showToast('error', 'New password must be at least 6 characters.')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      showToast('error', 'New passwords do not match.')
      return
    }
    if (pwForm.next === pwForm.current) {
      showToast('error', 'New password must be different from current.')
      return
    }

    setPwBusy(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      showToast('success', 'Password updated successfully.')
    } catch (err) {
      showToast('error', friendlyError(err))
    } finally {
      setPwBusy(false)
    }
  }

  // ============================
  // Email change
  // ============================
  const [emailForm, setEmailForm] = useState({
    password: '',
    newEmail: '',
  })
  const [emailBusy, setEmailBusy] = useState(false)

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!emailForm.password || !emailForm.newEmail) {
      showToast('error', 'Please fill in both fields.')
      return
    }
    if (emailForm.newEmail === user.email) {
      showToast('error', 'That is already your email address.')
      return
    }

    setEmailBusy(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, emailForm.password)
      await reauthenticateWithCredential(user, cred)
      await updateEmail(user, emailForm.newEmail)

      // Mirror in Firestore so the app knows
      await updateDoc(doc(db, 'users', user.uid), {
        email: emailForm.newEmail,
        updatedAt: serverTimestamp(),
      })
      await refreshProfile()

      setEmailForm({ password: '', newEmail: '' })
      showToast('success', 'Email updated successfully.')
    } catch (err) {
      showToast('error', friendlyError(err))
    } finally {
      setEmailBusy(false)
    }
  }

  // ============================
  // Notification preferences
  // ============================
  const [prefs, setPrefs] = useState({
    notifyApplications: profile?.notifyApplications ?? true,
    notifyMessages: profile?.notifyMessages ?? true,
    notifyInterviews: profile?.notifyInterviews ?? true,
    notifyCompanyUpdates: profile?.notifyCompanyUpdates ?? true,
  })
  const [prefsBusy, setPrefsBusy] = useState(false)

  const togglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setPrefsBusy(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...next,
        updatedAt: serverTimestamp(),
      })
      await refreshProfile()
    } catch (err) {
      setPrefs(prefs)
      showToast('error', friendlyError(err))
    } finally {
      setPrefsBusy(false)
    }
  }

  // ============================
  // Delete account
  // ============================
  const [showDelete, setShowDelete] = useState(false)
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmText: '',
  })
  const [deleteBusy, setDeleteBusy] = useState(false)

  const handleDeleteAccount = async () => {
    if (!deleteForm.password) {
      showToast('error', 'Please enter your password.')
      return
    }
    if (deleteForm.confirmText !== 'DELETE') {
      showToast('error', 'Type DELETE to confirm.')
      return
    }

    setDeleteBusy(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, deleteForm.password)
      await reauthenticateWithCredential(user, cred)

      // Best-effort cleanup of the user document
      try {
        await deleteDoc(doc(db, 'users', user.uid))
      } catch {
        /* best-effort */
      }

      await deleteUser(user)
      navigate('/', { replace: true })
    } catch (err) {
      showToast('error', friendlyError(err))
      setDeleteBusy(false)
    }
  }

  if (!user) return null

  return (
    <div className="container-app py-10 max-w-2xl">
      <Link
        to="/"
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Account Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your login credentials and preferences.
        </p>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ============================
          CHANGE PASSWORD
          ============================ */}
      <Section
        title="Password"
        subtitle="Change your password. You'll need your current one to confirm."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current password">
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                className="input pl-10"
                value={pwForm.current}
                onChange={(e) =>
                  setPwForm({ ...pwForm, current: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="New password">
              <input
                type="password"
                className="input"
                value={pwForm.next}
                onChange={(e) =>
                  setPwForm({ ...pwForm, next: e.target.value })
                }
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className="input"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirm: e.target.value })
                }
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwBusy}
              className="btn-primary !py-2 !px-4 text-sm"
            >
              {pwBusy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating...
                </>
              ) : (
                'Update password'
              )}
            </button>
          </div>
        </form>
      </Section>

      {/* ============================
          CHANGE EMAIL
          ============================ */}
      <Section
        title="Email address"
        subtitle="The email you use to sign in."
      >
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <Field label="Current email">
            <input
              className="input bg-gray-50"
              value={user.email || ''}
              readOnly
              disabled
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="New email">
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  className="input pl-10"
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, newEmail: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </div>
            </Field>
            <Field label="Confirm with password">
              <input
                type="password"
                className="input"
                value={emailForm.password}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, password: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailBusy}
              className="btn-primary !py-2 !px-4 text-sm"
            >
              {emailBusy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating...
                </>
              ) : (
                'Update email'
              )}
            </button>
          </div>
        </form>
      </Section>

      {/* ============================
          NOTIFICATION PREFERENCES
          ============================ */}
      <Section
        title="Notifications"
        subtitle="Choose what you want to be notified about."
      >
        <div className="space-y-1 divide-y divide-gray-100">
          {[
            {
              key: 'notifyApplications',
              label: 'Application updates',
              hint: 'When your application status changes',
            },
            {
              key: 'notifyMessages',
              label: 'New messages',
              hint: 'When someone messages you',
            },
            {
              key: 'notifyInterviews',
              label: 'Interviews',
              hint: 'Interview invites and reminders',
            },
            {
              key: 'notifyCompanyUpdates',
              label: 'Company updates',
              hint: 'Updates from companies you follow',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => togglePref(item.key)}
                disabled={prefsBusy}
                className={`relative w-11 h-6 rounded-full transition shrink-0 ${
                  prefs[item.key] ? 'bg-brand-600' : 'bg-gray-300'
                }`}
                aria-pressed={prefs[item.key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================
          DANGER ZONE
          ============================ */}
      <Section
        title="Delete account"
        subtitle="Permanently remove your account and all your data."
      >
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                This action cannot be undone.
              </p>
              <p className="text-xs text-red-700/80 mt-1">
                Your profile, applications, and messages will be removed.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="mt-3 text-sm font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete my account
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================
          DELETE CONFIRM MODAL
          ============================ */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <h3 className="font-bold text-gray-900">Delete account</h3>
              </div>
              <button
                onClick={() => !deleteBusy && setShowDelete(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                This will permanently delete <strong>{user.email}</strong> and
                everything associated with it. This cannot be undone.
              </p>

              <Field label="Confirm with your password">
                <input
                  type="password"
                  className="input"
                  value={deleteForm.password}
                  onChange={(e) =>
                    setDeleteForm({ ...deleteForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>

              <Field
                label="Type DELETE to confirm"
                hint="Case-sensitive — must be exactly DELETE."
              >
                <input
                  className="input"
                  value={deleteForm.confirmText}
                  onChange={(e) =>
                    setDeleteForm({
                      ...deleteForm,
                      confirmText: e.target.value,
                    })
                  }
                  placeholder="DELETE"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleteBusy}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteBusy || deleteForm.confirmText !== 'DELETE'}
                className="btn-primary !bg-red-600 hover:!bg-red-700 disabled:opacity-50"
              >
                {deleteBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete permanently
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