import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Trash2,
  Plus,
  Bell,
  BellOff,
  MapPin,
  Briefcase,
  Building2,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  listMySavedSearches,
  toggleSavedSearch,
  deleteSavedSearch,
  searchToQueryString,
} from '../services/savedSearchService'
import { listPublishedJobs } from '../services/jobService'
import { matchesSearch } from '../services/savedSearchService'
import { friendlyError } from '../utils/errors'

const JOB_TYPES = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}
const WORK_MODES = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
const EXPERIENCE = {
  entry: 'Entry',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
}

function filterPills(search) {
  const pills = []
  if (search.q) pills.push({ icon: Search, label: search.q })
  if (search.location) pills.push({ icon: MapPin, label: search.location })
  if (search.jobType)
    pills.push({ icon: Briefcase, label: JOB_TYPES[search.jobType] || search.jobType })
  if (search.workMode)
    pills.push({ icon: Building2, label: WORK_MODES[search.workMode] || search.workMode })
  if (search.experienceLevel)
    pills.push({
      icon: ArrowRight,
      label: `${EXPERIENCE[search.experienceLevel] || search.experienceLevel} level`,
    })
  if (search.category) pills.push({ icon: Briefcase, label: search.category })
  return pills
}

export default function MySearches() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [searches, setSearches] = useState([])
  const [jobCounts, setJobCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    if (!user) return
    try {
      const [list, jobs] = await Promise.all([
        listMySavedSearches(user.uid),
        listPublishedJobs(300),
      ])
      setSearches(list)

      // Count live matches per search
      const counts = {}
      list.forEach((s) => {
        counts[s.id] = jobs.filter((j) => matchesSearch(j, s)).length
      })
      setJobCounts(counts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleToggle = async (search) => {
    setBusyId(search.id)
    try {
      await toggleSavedSearch(search.id, !search.enabled)
      setSearches((list) =>
        list.map((s) =>
          s.id === search.id ? { ...s, enabled: !s.enabled } : s
        )
      )
      toast.success(
        search.enabled ? 'Alerts paused' : 'Alerts turned on',
        search.enabled
          ? `You'll stop getting updates for "${search.name}".`
          : `You'll get notified about new matches for "${search.name}".`
      )
    } catch (err) {
      toast.error('Could not update', friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (search) => {
    if (!window.confirm(`Delete saved search "${search.name}"?`)) return
    setBusyId(search.id)
    try {
      await deleteSavedSearch(search.id)
      setSearches((list) => list.filter((s) => s.id !== search.id))
      toast.success('Search deleted')
    } catch (err) {
      toast.error('Could not delete', friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleRunSearch = (search) => {
    const qs = searchToQueryString(search)
    navigate(`/jobs${qs ? `?${qs}` : ''}`)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Search size={26} className="text-brand-600" />
            My Searches
          </h1>
          <p className="text-gray-500 mt-1">
            Save your favorite job searches and get notified when new matches appear.
          </p>
        </div>
        <Link to="/jobs" className="btn-primary">
          <Plus size={16} /> New search
        </Link>
      </div>

      {searches.length === 0 ? (
        <div className="card text-center py-16">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No saved searches yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Go to Find Jobs, set your filters, then click “Save this search”.
          </p>
          <Link to="/jobs" className="btn-primary inline-flex">
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {searches.map((s) => {
            const pills = filterPills(s)
            const liveCount = jobCounts[s.id] || 0
            const busy = busyId === s.id

            return (
              <div
                key={s.id}
                className={`card transition ${
                  s.enabled === false ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {s.name}
                      </h3>
                      {s.enabled === false ? (
                        <span className="badge bg-gray-100 text-gray-600 inline-flex items-center gap-1">
                          <BellOff size={11} /> Paused
                        </span>
                      ) : (
                        <span className="badge bg-green-50 text-green-700 border border-green-100 inline-flex items-center gap-1">
                          <Bell size={11} /> Active
                        </span>
                      )}
                      <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
                        {liveCount} live {liveCount === 1 ? 'match' : 'matches'}
                      </span>
                    </div>

                    {/* Filter pills */}
                    {pills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pills.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 rounded-md px-2 py-1"
                          >
                            <p.icon size={11} />
                            {p.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-gray-500">
                        No filters — matches all jobs.
                      </p>
                    )}

                    {s.createdAt?.seconds && (
                      <p className="text-[11px] text-gray-400 mt-2 inline-flex items-center gap-1">
                        <Calendar size={10} /> Saved{' '}
                        {new Date(
                          s.createdAt.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => handleRunSearch(s)}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <ArrowRight size={14} /> Run search
                    </button>
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={busy}
                      className={`btn-outline !py-2 !px-3 text-sm ${
                        s.enabled === false
                          ? '!text-green-700 !border-green-200'
                          : '!text-yellow-700 !border-yellow-200'
                      }`}
                    >
                      {s.enabled === false ? (
                        <>
                          <Bell size={14} /> Enable alerts
                        </>
                      ) : (
                        <>
                          <BellOff size={14} /> Pause alerts
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={busy}
                      className="btn-outline !py-2 !px-3 text-sm !text-red-600 !border-red-200"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}