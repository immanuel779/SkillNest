import { useEffect, useMemo, useState } from 'react'
import { Search, Briefcase, Building2, Calendar } from 'lucide-react'
import { listAllApplications } from '../../services/adminService'

const STATUS_TABS = [
  { v: 'all', l: 'All' },
  { v: 'applied', l: 'Applied' },
  { v: 'shortlisted', l: 'Shortlisted' },
  { v: 'interview', l: 'Interview' },
  { v: 'hired', l: 'Hired' },
  { v: 'rejected', l: 'Rejected' },
]

function StatusBadge({ status }) {
  const styles = {
    applied: 'bg-blue-50 text-blue-700 border border-blue-100',
    under_review: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    shortlisted: 'bg-green-50 text-green-700 border border-green-100',
    interview: 'bg-purple-50 text-purple-700 border border-purple-100',
    hired: 'bg-brand-100 text-brand-800',
    rejected: 'bg-red-50 text-red-700 border border-red-100',
  }
  return (
    <span className={`badge ${styles[status] || styles.applied}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function AdminApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listAllApplications()
        if (alive) setApps(list)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return apps.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (needle) {
        const hay = [a.applicantEmail, a.jobTitle, a.companyName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [apps, q, status])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Applications</h2>
        <p className="text-sm text-gray-500 mt-1">
          {apps.length} total applications across the platform.
        </p>
      </div>

      <div className="card !p-3 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <Search size={16} className="text-brand-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by applicant, job, or company..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const count =
              t.v === 'all'
                ? apps.length
                : apps.filter((a) => a.status === t.v).length
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
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No applications match your filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{a.jobTitle}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={12} /> {a.applicantEmail}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={12} /> {a.companyName}
                    </span>
                    {a.createdAt?.seconds && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(a.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}