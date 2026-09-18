import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  X,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  Save,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { listPublishedJobs } from '../services/jobService'
import { isJobSaved, saveJob, unsaveJob } from '../services/savedJobService'
import { createSavedSearch } from '../services/savedSearchService'
import { SkeletonList } from '../components/Skeletons'
import { friendlyError } from '../utils/errors'

const JOB_TYPES = [
  { v: '', l: 'All types' },
  { v: 'full_time', l: 'Full-time' },
  { v: 'part_time', l: 'Part-time' },
  { v: 'contract', l: 'Contract' },
  { v: 'internship', l: 'Internship' },
  { v: 'temporary', l: 'Temporary' },
]
const WORK_MODES = [
  { v: '', l: 'All modes' },
  { v: 'onsite', l: 'On-site' },
  { v: 'remote', l: 'Remote' },
  { v: 'hybrid', l: 'Hybrid' },
]
const EXPERIENCE = [
  { v: '', l: 'All levels' },
  { v: 'entry', l: 'Entry' },
  { v: 'mid', l: 'Mid' },
  { v: 'senior', l: 'Senior' },
  { v: 'lead', l: 'Lead' },
  { v: 'executive', l: 'Executive' },
]
const CATEGORIES = [
  { v: '', l: 'All categories' },
  { v: 'Engineering', l: 'Engineering' },
  { v: 'Design', l: 'Design' },
  { v: 'Product', l: 'Product' },
  { v: 'Marketing', l: 'Marketing' },
  { v: 'Sales', l: 'Sales' },
  { v: 'Customer Support', l: 'Customer Support' },
  { v: 'Finance', l: 'Finance' },
  { v: 'Human Resources', l: 'Human Resources' },
  { v: 'Operations', l: 'Operations' },
  { v: 'Data & Analytics', l: 'Data & Analytics' },
  { v: 'Other', l: 'Other' },
]

export default function FindJobs() {
  const { user } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [jobs, setJobs] = useState([])
  const [savedMap, setSavedMap] = useState({})
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [jobType, setJobType] = useState(searchParams.get('jobType') || '')
  const [workMode, setWorkMode] = useState(searchParams.get('workMode') || '')
  const [experienceLevel, setExperienceLevel] = useState(
    searchParams.get('experienceLevel') || ''
  )
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [showFilters, setShowFilters] = useState(false)

  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [savingSearch, setSavingSearch] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listPublishedJobs(200)
        if (!alive) return
        setJobs(list)
        if (user) {
          const map = {}
          await Promise.all(
            list.map(async (j) => {
              map[j.id] = await isJobSaved(user.uid, j.id)
            })
          )
          if (alive) setSavedMap(map)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (location) next.set('location', location)
    if (jobType) next.set('jobType', jobType)
    if (workMode) next.set('workMode', workMode)
    if (experienceLevel) next.set('experienceLevel', experienceLevel)
    if (category) next.set('category', category)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, location, jobType, workMode, experienceLevel, category])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return jobs.filter((j) => {
      if (needle) {
        const hay = [
          j.title,
          j.description,
          j.companyName,
          ...(j.skills || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (
        location &&
        !(j.location || '').toLowerCase().includes(location.toLowerCase())
      )
        return false
      if (jobType && j.jobType !== jobType) return false
      if (workMode && j.workMode !== workMode) return false
      if (experienceLevel && j.experienceLevel !== experienceLevel) return false
      if (category && j.category !== category) return false
      return true
    })
  }, [jobs, q, location, jobType, workMode, experienceLevel, category])

  const toggleSave = async (e, job) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.info('Sign in to save jobs')
      return
    }
    const currentlySaved = savedMap[job.id]
    try {
      if (currentlySaved) {
        await unsaveJob(user.uid, job.id)
        toast.success('Removed from saved')
      } else {
        await saveJob(user.uid, job.id)
        toast.success('Saved for later')
      }
      setSavedMap((m) => ({ ...m, [job.id]: !currentlySaved }))
    } catch (err) {
      toast.error('Could not save job', friendlyError(err))
    }
  }

  const clearFilters = () => {
    setQ('')
    setLocation('')
    setJobType('')
    setWorkMode('')
    setExperienceLevel('')
    setCategory('')
  }

  const activeFilters =
    (q ? 1 : 0) +
    (location ? 1 : 0) +
    (jobType ? 1 : 0) +
    (workMode ? 1 : 0) +
    (experienceLevel ? 1 : 0) +
    (category ? 1 : 0)

  const handleSaveSearch = async () => {
    if (!user) {
      toast.info('Sign in to save searches')
      return
    }
    if (!saveName.trim()) {
      toast.error('Give your search a name')
      return
    }
    setSavingSearch(true)
    try {
      await createSavedSearch(user.uid, saveName, {
        q,
        location,
        jobType,
        workMode,
        experienceLevel,
        category,
      })
      toast.success('Search saved', "We'll notify you when new jobs match.")
      setShowSave(false)
      setSaveName('')
    } catch (err) {
      toast.error('Could not save search', friendlyError(err))
    } finally {
      setSavingSearch(false)
    }
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Find Jobs</h1>
        <p className="text-gray-500 mt-1">
          {loading
            ? 'Loading roles...'
            : `${filtered.length} ${
                filtered.length === 1 ? 'role' : 'roles'
              } available`}
        </p>
      </div>

      <div className="card mb-6 !p-3">
        <div className="flex flex-col md:flex-row items-stretch gap-2">
          <div className="flex items-center gap-2 px-3 py-2 flex-1 rounded-lg bg-gray-50">
            <Search size={18} className="text-brand-600 shrink-0" />
            <input
              data-search-input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Job title, keyword, or skill"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 flex-1 rounded-lg bg-gray-50">
            <MapPin size={18} className="text-brand-600 shrink-0" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-outline relative"
          >
            <Filter size={16} /> Filters
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>

          {user && activeFilters > 0 && (
            <button
              onClick={() => {
                setSaveName('')
                setShowSave(true)
              }}
              className="btn-outline"
            >
              <Save size={16} /> Save search
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Job type</label>
              <select
                className="input"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Work mode</label>
              <select
                className="input"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
              >
                {WORK_MODES.map((w) => (
                  <option key={w.v} value={w.v}>
                    {w.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Experience</label>
              <select
                className="input"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                {EXPERIENCE.map((x) => (
                  <option key={x.v} value={x.v}>
                    {x.l}
                  </option>
                ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="sm:col-span-2 lg:col-span-4 text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 justify-center"
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonList count={4} variant="job" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">
            No jobs match your search
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your filters or search terms.
          </p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="btn-outline mt-6">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((j) => (
            <Link
              key={j.id}
              to={`/jobs/${j.id}`}
              className="card card-hover block group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                      {j.title}
                    </h3>
                    <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
                      {j.jobType?.replace('_', ' ')}
                    </span>
                    <span className="badge bg-gray-100 text-gray-600">
                      {j.workMode}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 font-medium inline-flex items-center gap-1.5">
                    {j.companyName}
                    {j.companyVerified && (
                      <BadgeCheck size={13} className="text-blue-600" />
                    )}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {j.location || '—'}
                    </span>
                    <span>{j.experienceLevel} level</span>
                    {(j.salaryMin || j.salaryMax) && (
                      <span className="font-semibold text-gray-700">
                        {j.currency || 'USD'}{' '}
                        {j.salaryMin?.toLocaleString?.() || '—'} –{' '}
                        {j.salaryMax?.toLocaleString?.() || '—'}
                      </span>
                    )}
                  </div>
                  {j.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 rounded-md px-2 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {user && (
                  <button
                    onClick={(e) => toggleSave(e, j)}
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition"
                    aria-label="Save"
                  >
                    {savedMap[j.id] ? (
                      <BookmarkCheck size={18} className="text-brand-700" />
                    ) : (
                      <Bookmark size={18} />
                    )}
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Save this search</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                We'll send you a notification when new jobs match.
              </p>
            </div>
            <div className="p-5">
              <label className="label">Name your search</label>
              <input
                className="input"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Remote React jobs"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
              {activeFilters > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  Saving {activeFilters} active{' '}
                  {activeFilters === 1 ? 'filter' : 'filters'}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowSave(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={savingSearch || !saveName.trim()}
                className="btn-primary"
              >
                <Save size={16} />
                {savingSearch ? 'Saving...' : 'Save search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}