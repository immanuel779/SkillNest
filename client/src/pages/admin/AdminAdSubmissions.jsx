import { useEffect, useMemo, useState } from 'react'
import {
  Megaphone,
  Loader2,
  Check,
  X,
  Trash2,
  ExternalLink,
  Clock,
  Search,
} from 'lucide-react'
import {
  listAllAdSubmissions,
  approveAdSubmission,
  rejectAdSubmission,
  deleteAdSubmission,
} from '../../services/adsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { v: 'pending', l: 'Pending' },
  { v: 'awaiting_payment_confirmation', l: 'Paid' },
  { v: 'approved', l: 'Live' },
  { v: 'rejected', l: 'Rejected' },
  { v: 'all', l: 'All' },
]

function fmtDate(ts) {
  if (!ts?.seconds) return '—'
  return new Date(ts.seconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminAdSubmissions() {
  const { user } = useAuth()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setSubs(await listAllAdSubmissions())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: subs.length }
    subs.forEach((s) => {
      c[s.status] = (c[s.status] || 0) + 1
    })
    return c
  }, [subs])

  const filtered = useMemo(() => {
    let list = tab === 'all' ? subs : subs.filter((s) => s.status === tab)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((s) =>
        [s.businessName, s.headline, s.userEmail]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [subs, tab, search])

  const handleApprove = async (s) => {
    if (!window.confirm(`Approve "${s.headline}"?\n\nIt will go live immediately.`))
      return
    setBusyId(s.id)
    try {
      await approveAdSubmission(s.id, user.uid)
      toast.success('Ad approved and live', s.businessName)
      load()
    } catch (err) {
      toast.error('Could not approve', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = (s) => {
    setRejecting(s)
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejecting) return
    setBusyId(rejecting.id)
    try {
      await rejectAdSubmission(rejecting.id, user.uid, rejectReason)
      toast.success('Ad rejected')
      setRejecting(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.error('Could not reject', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (s) => {
    if (!window.confirm('Delete this submission permanently?')) return
    try {
      await deleteAdSubmission(s.id)
      toast.success('Deleted')
      load()
    } catch (err) {
      toast.error('Delete failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
          <Megaphone size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">Ad Submissions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and approve ads from businesses before they go live.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.v
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-brand-700'
            }`}
          >
            {t.l}{' '}
            <span className="text-xs opacity-70">({counts[t.v] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-10"
          placeholder="Search by business, headline, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={24} className="animate-spin text-brand-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Megaphone size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            No {tab === 'all' ? '' : tab} submissions
          </p>
          <p className="text-sm mt-1">
            When businesses submit ads, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => {
            const busy = busyId === s.id
            return (
              <div key={s.id} className="card">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Logo */}
                  <div className="w-full lg:w-32 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Megaphone size={28} className="text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {s.headline}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                          s.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : s.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-brand-700 dark:text-brand-400">
                      {s.businessName}
                    </p>

                    {s.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {s.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>👤 {s.userEmail || s.userName || 'Unknown'}</span>
                      <span>
                        💰 {s.currency} {Number(s.price || 0).toLocaleString()}{' '}
                        ({s.packageName})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {fmtDate(s.createdAt)}
                      </span>
                    </div>

                    <a
                      href={s.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      {s.ctaUrl?.slice(0, 60)}
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
                    {s.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(s)}
                          disabled={busy}
                          className="btn-primary !py-2 !px-4 text-sm !bg-green-600 hover:!bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(s)}
                          disabled={busy}
                          className="btn-outline !py-2 !px-4 text-sm !text-red-600 !border-red-200 whitespace-nowrap"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    {s.status !== 'pending' && (
                      <button
                        onClick={() => handleDelete(s)}
                        className="btn-outline !py-2 !px-4 text-sm !text-red-600 !border-red-200"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">Reject this ad?</h3>
              <p className="text-sm text-gray-500 mt-1">
                "{rejecting.headline}" from {rejecting.businessName}
              </p>
            </div>
            <div className="p-5">
              <label className="label">Reason (sent to the business)</label>
              <textarea
                rows={4}
                className="input resize-none"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Logo image is low quality. Please upload a square PNG."
                maxLength={500}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setRejecting(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={busyId === rejecting.id}
                className="btn-primary !bg-red-600 hover:!bg-red-700 disabled:opacity-50"
              >
                {busyId === rejecting.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
                Reject ad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}