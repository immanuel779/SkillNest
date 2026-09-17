import { useEffect, useState } from 'react'
import { Flag, CheckCircle2, XCircle, Inbox } from 'lucide-react'
import { listAllReports, updateReportStatus } from '../../services/adminService'

const STATUS_TABS = [
  { v: 'all', l: 'All' },
  { v: 'open', l: 'Open' },
  { v: 'reviewing', l: 'Reviewing' },
  { v: 'resolved', l: 'Resolved' },
  { v: 'dismissed', l: 'Dismissed' },
]

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-red-50 text-red-700 border border-red-100',
    reviewing: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    resolved: 'bg-green-50 text-green-700 border border-green-100',
    dismissed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`badge ${styles[status] || styles.open}`}>
      {status}
    </span>
  )
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      setReports(await listAllReports())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setReportStatus = async (id, s) => {
    await updateReportStatus(id, s)
    load()
  }

  const filtered =
    status === 'all' ? reports : reports.filter((r) => r.status === status)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Reports</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review reports from users and take action.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const count =
            t.v === 'all'
              ? reports.length
              : reports.filter((r) => r.status === t.v).length
          return (
            <button
              key={t.v}
              onClick={() => setStatus(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                status === t.v
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {t.l} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No reports here</p>
          <p className="text-sm text-gray-500 mt-1">
            Reports from users will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Flag size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{r.reason}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Target: {r.targetType} · {r.targetId}
                  </p>
                  {r.details && (
                    <p className="text-sm text-gray-600 mt-2">{r.details}</p>
                  )}
                  {r.createdAt?.seconds && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Reported {new Date(r.createdAt.seconds * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {r.status !== 'reviewing' && r.status !== 'resolved' && (
                    <button
                      onClick={() => setReportStatus(r.id, 'reviewing')}
                      className="btn-outline !py-2 !px-3 text-sm !text-yellow-700 !border-yellow-200"
                    >
                      Reviewing
                    </button>
                  )}
                  {r.status !== 'resolved' && (
                    <button
                      onClick={() => setReportStatus(r.id, 'resolved')}
                      className="btn-outline !py-2 !px-3 text-sm !text-green-700 !border-green-200"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                  )}
                  {r.status !== 'dismissed' && (
                    <button
                      onClick={() => setReportStatus(r.id, 'dismissed')}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <XCircle size={13} /> Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}