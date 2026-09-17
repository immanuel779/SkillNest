import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserX,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  X,
} from 'lucide-react'
import { listAllUsers, setUserSuspended } from '../../services/adminService'

const ROLE_TABS = [
  { v: 'all', l: 'All' },
  { v: 'job_seeker', l: 'Job Seekers' },
  { v: 'employer', l: 'Employers' },
  { v: 'admin', l: 'Admins' },
]

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [roleTab, setRoleTab] = useState('all')
  const [statusTab, setStatusTab] = useState('all')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await listAllUsers())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return users.filter((u) => {
      if (roleTab !== 'all' && u.role !== roleTab) return false
      if (statusTab === 'active' && u.isSuspended) return false
      if (statusTab === 'suspended' && !u.isSuspended) return false
      if (needle) {
        const hay = [u.fullName, u.email].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [users, q, roleTab, statusTab])

  const handleSuspendToggle = async (u, reason = '') => {
    try {
      await setUserSuspended(u.id, !u.isSuspended, reason)
      setConfirmTarget(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Users</h2>
        <p className="text-sm text-gray-500 mt-1">
          {users.length} total · suspend or reactivate accounts.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card !p-3 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <Search size={16} className="text-brand-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((t) => (
            <button
              key={t.v}
              onClick={() => setRoleTab(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                roleTab === t.v
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {t.l}
            </button>
          ))}
          <span className="mx-1 self-center text-gray-300">|</span>
          {[
            { v: 'all', l: 'All status' },
            { v: 'active', l: 'Active' },
            { v: 'suspended', l: 'Suspended' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setStatusTab(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                statusTab === t.v
                  ? 'bg-accent-500 text-white border-accent-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No users match your filters.
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">
                          {u.fullName || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-700">
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isSuspended ? (
                        <span className="badge bg-red-50 text-red-700 border border-red-100">
                          Suspended
                        </span>
                      ) : (
                        <span className="badge bg-green-50 text-green-700 border border-green-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-gray-400">Protected</span>
                      ) : u.isSuspended ? (
                        <button
                          onClick={() => handleSuspendToggle(u)}
                          className="btn-outline !py-1.5 !px-3 text-xs !text-green-700 !border-green-200"
                        >
                          <UserCheck size={13} /> Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget(u)}
                          className="btn-outline !py-1.5 !px-3 text-xs !text-red-600 !border-red-200"
                        >
                          <UserX size={13} /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmTarget && (
        <SuspendModal
          user={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={(reason) => handleSuspendToggle(confirmTarget, reason)}
        />
      )}
    </div>
  )
}

function SuspendModal({ user, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="font-bold">Suspend account</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="p-5">
          <label className="label">Reason (optional)</label>
          <textarea
            rows={3}
            className="input resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this account being suspended?"
          />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="btn-primary !bg-red-600 hover:!bg-red-700"
          >
            Confirm suspend
          </button>
        </div>
      </div>
    </div>
  )
}