import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  EyeOff,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import {
  listAllJobs,
  adminUpdateJobStatus,
  adminDeleteJob,
} from '../../services/adminService'

const STATUS_TABS = [
  { v: 'all', l: 'All' },
  { v: 'published', l: 'Published' },
  { v: 'draft', l: 'Draft' },
  { v: 'closed', l: 'Closed' },
  { v: 'unpublished', l: 'Unpublished' },
]

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setJobs(await listAllJobs())
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
    return jobs.filter((j) => {
      if (status !== 'all' && j.status !== status) return false
      if (needle) {
        const hay = [j.title, j.companyName, j.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [jobs, q, status])

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    try {
      await adminDeleteJob(job.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const unpublish = async (job) => {
    try {
      await adminUpdateJobStatus(job.id, 'unpublished')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const restore = async (job) => {
    try {
      await adminUpdateJobStatus(job.id, 'published')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Jobs</h2>
        <p className="text-sm text-gray-500 mt-1">
          {jobs.length} job postings · remove inappropriate listings.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="card !p-3 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <Search size={16} className="text-brand-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, company, or location..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.v}
              onClick={() => setStatus(t.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                status === t.v
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No jobs match your filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((j) => (
            <div key={j.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{j.title}</h3>
                    <span
                      className={`badge ${
                        j.status === 'published'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : j.status === 'closed'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{j.companyName}</p>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4">
                    <span>{j.location || '—'}</span>
                    <span>{j.jobType?.replace('_', ' ')}</span>
                    <span>{j.workMode}</span>
                    <span>{j.applicantCount || 0} applicants</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={`/jobs/${j.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline !py-2 !px-3 text-sm"
                  >
                    <ExternalLink size={13} /> View
                  </a>
                  {j.status === 'published' ? (
                    <button
                      onClick={() => unpublish(j)}
                      className="btn-outline !py-2 !px-3 text-sm !text-yellow-700 !border-yellow-200"
                    >
                      <EyeOff size={13} /> Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => restore(j)}
                      className="btn-outline !py-2 !px-3 text-sm !text-green-700 !border-green-200"
                    >
                      <CheckCircle2 size={13} /> Publish
                    </button>
                  )}
                  <button
                    onClick={() => remove(j)}
                    className="btn-outline !py-2 !px-3 text-sm !text-red-600 !border-red-200"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}