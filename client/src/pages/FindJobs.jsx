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
  Share2,
  Building2,
  Banknote,
  Clock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { listPublishedJobs } from '../services/jobService'
import { isJobSaved, saveJob, unsaveJob } from '../services/savedJobService'
import { createSavedSearch } from '../services/savedSearchService'
import AIJobMatchBadge from '../components/ai/AIJobMatchBadge'
import { SkeletonList } from '../components/Skeletons'
import { friendlyError } from '../utils/errors'
import { formatSalaryRange } from '../utils/currency'

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
  const { user, profile } = useAuth()
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

  // 👇 NEW: SHARE FUNCTION 👇
  const handleShare = async (e, job) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/jobs/${job.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job at ${job.companyName}: ${job.title}`,
          url: url,
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback for desktop
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link Copied!', 'Job link copied to clipboard.')
      } catch (err) {
        toast.error('Failed to copy', 'Please copy the URL manually.')
      }
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
    <div className="bg-gray-50/50 min-h-screen pb-20">
      
      {/* ─── DARK HERO SECTION WITH SEARCH ─── */}
      <div className="bg-[#0f172a] text-white pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#7c3aed]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container-app relative max-w-4xl mx-auto text-center z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Find your next <br className="hidden sm:block" />
            <span className="text-[#7c3aed]">career move</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {loading ? 'Loading roles...' : `${filtered.length} verified roles available right now`}
          </p>

          {/* Floating Search Bar */}
          <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-2 flex-1 rounded-xl bg-gray-50 border border-gray-100">
              <Search size={20} className="text-[#7c3aed] shrink-0" />
              <input
                data-search-input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title, keyword, or skill"
                className="bg-transparent outline-none text-sm text-gray-900 w-full font-medium"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 flex-1 rounded-xl bg-gray-50 border border-gray-100">
              <MapPin size={20} className="text-[#7c3aed] shrink-0" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Lagos, Remote)"
                className="bg-transparent outline-none text-sm text-gray-900 w-full font-medium"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
                showFilters ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} /> Filters
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container-app max-w-5xl mx-auto -mt-16 relative z-20">
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Advanced Filters</h3>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                  <X size={14} /> Clear all
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none bg-gray-50" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Job type</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none bg-gray-50" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  {JOB_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Work mode</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none bg-gray-50" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                  {WORK_MODES.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Experience</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none bg-gray-50" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  {EXPERIENCE.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                </select>
              </div>
            </div>
            {user && activeFilters > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => { setSaveName(''); setShowSave(true) }} className="btn-outline !py-2 !px-4 text-sm !text-[#7c3aed] !border-[#7c3aed]/30 hover:!bg-purple-50">
                  <Save size={16} /> Save this search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Job List */}
        {loading ? (
          <SkeletonList count={4} variant="job" />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No jobs match your search</h3>
            <p className="text-gray-500 mt-2">Try adjusting your keywords, location, or filters.</p>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="btn-primary !bg-gray-900 !border-0 mt-6 shadow-md">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((j) => {
              const salaryText = formatSalaryRange(j.currency, j.salaryMin, j.salaryMax)
              return (
                <Link
                  key={j.id}
                  to={`/jobs/${j.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-[#7c3aed]/30 transition-all duration-300 block group relative overflow-hidden"
                >
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/0 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 relative z-10">
                    
                    {/* Company Logo Placeholder */}
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400 font-bold text-xl">
                      {j.companyName?.[0]?.toUpperCase() || <Building2 size={24} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#7c3aed] transition-colors leading-tight mb-1">
                            {j.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-semibold mb-3">
                            {j.companyName}
                            {j.companyVerified && <BadgeCheck size={16} className="text-blue-500" />}
                          </div>
                        </div>
                        
                        {/* Actions (Save & Share) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {user && (
                            <button
                              onClick={(e) => toggleSave(e, j)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${savedMap[j.id] ? 'bg-purple-100 text-[#7c3aed]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                              title="Save Job"
                            >
                              {savedMap[j.id] ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                            </button>
                          )}
                          
                          {/* 👇 THE NEW SHARE BUTTON 👇 */}
                          <button
                            onClick={(e) => handleShare(e, j)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            title="Share Job"
                          >
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-md">
                          <MapPin size={12} /> {j.location || 'Anywhere'}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-md">
                          <Clock size={12} /> {j.jobType?.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-[#7c3aed] text-[11px] font-bold px-2.5 py-1 rounded-md">
                          <Briefcase size={12} /> {j.workMode}
                        </span>
                        {salaryText && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-md">
                            <Banknote size={12} /> {salaryText}
                          </span>
                        )}
                      </div>

                      {/* Skills & AI Match */}
                      <div className="flex items-center justify-between flex-wrap gap-3 mt-auto pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1.5">
                          {j.skills?.slice(0, 4).map((s) => (
                            <span key={s} className="text-[10px] bg-white border border-gray-200 text-gray-600 rounded px-2 py-0.5">
                              {s}
                            </span>
                          ))}
                        </div>
                        {user && profile?.role === 'job_seeker' && (
                          <AIJobMatchBadge job={j} candidate={{ ...profile, uid: user.uid }} compact />
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <Save className="text-[#7c3aed]" size={24} />
              </div>
              <h3 className="font-extrabold text-xl text-gray-900">Save this search</h3>
              <p className="text-sm text-gray-500 mt-1">We'll alert you the moment a new job matches these exact filters.</p>
            </div>
            <div className="p-6">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Name your search</label>
              <input
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Remote React Developer Jobs"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
              <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                <Filter size={14} className="text-[#7c3aed]"/> Saving {activeFilters} active {activeFilters === 1 ? 'filter' : 'filters'}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setShowSave(false)} className="btn-outline !px-6">Cancel</button>
              <button onClick={handleSaveSearch} disabled={savingSearch || !saveName.trim()} className="btn-primary !bg-[#7c3aed] !border-0 !px-6">
                <Save size={16} /> {savingSearch ? 'Saving...' : 'Save Search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}