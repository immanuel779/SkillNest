import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Building2,
  BadgeCheck,
  Zap,
  Users,
  X,
  SlidersHorizontal,
  Briefcase,
} from 'lucide-react'
import { listAllPublicCompanies } from '../services/companyService'
import { listPublishedJobs } from '../services/jobService'
import { SkeletonCard } from '../components/Skeletons'

const SORTS = [
  { v: 'followers', l: 'Most followed' },
  { v: 'newest', l: 'Newest' },
  { v: 'jobs', l: 'Most jobs' },
  { v: 'name', l: 'A → Z' },
]

const FILTERS = [
  { v: 'all', l: 'All' },
  { v: 'verified', l: 'Verified' },
  { v: 'hiring', l: 'Hiring now' },
]

function formatCount(n) {
  const num = Number(n) || 0
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`
  return num.toString()
}

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [jobCounts, setJobCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('followers')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [list, jobs] = await Promise.all([
          listAllPublicCompanies(),
          listPublishedJobs(500),
        ])
        if (!alive) return

        setCompanies(list)

        const counts = {}
        jobs.forEach((j) => {
          counts[j.companyId] = (counts[j.companyId] || 0) + 1
        })
        setJobCounts(counts)
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

    let list = companies.filter((c) => {
      if (filter === 'verified' && !c.verified) return false
      if (filter === 'hiring' && (jobCounts[c.id] || 0) < 1) return false

      if (needle) {
        const hay = [c.name, c.industry, c.location, c.tagline]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'newest') {
        const ta = a.createdAt?.seconds || 0
        const tb = b.createdAt?.seconds || 0
        return tb - ta
      }
      if (sort === 'jobs')
        return (jobCounts[b.id] || 0) - (jobCounts[a.id] || 0)
      return (b.followerCount || 0) - (a.followerCount || 0)
    })

    return list
  }, [companies, jobCounts, q, filter, sort])

  const activeFilters = (q ? 1 : 0) + (filter !== 'all' ? 1 : 0)
  const clearAll = () => {
    setQ('')
    setFilter('all')
    setSort('followers')
  }

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">Companies</h1>
        <p className="text-gray-500 mt-1">
          {loading
            ? 'Loading companies...'
            : `${filtered.length} ${filtered.length === 1 ? 'company' : 'companies'} on SkillNest`}
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
              placeholder="Search by name, industry, or location..."
              className="bg-transparent outline-none text-sm w-full"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 md:w-52">
            <SlidersHorizontal size={16} className="text-brand-600 shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent outline-none text-sm w-full cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {FILTERS.map((f) => {
            const active = filter === f.v
            return (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  active
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {f.l}
                {f.v === 'verified' && (
                  <BadgeCheck size={12} className="inline ml-1 -mt-0.5" />
                )}
                {f.v === 'hiring' && (
                  <Zap size={12} className="inline ml-1 -mt-0.5" />
                )}
              </button>
            )
          })}

          {activeFilters > 0 && (
            <button
              onClick={clearAll}
              className="ml-auto text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No companies found</p>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length === 0
              ? 'No companies have set up their space yet. Check back soon.'
              : 'Try adjusting your search or filters.'}
          </p>
          {activeFilters > 0 && (
            <button onClick={clearAll} className="btn-outline mt-6">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const jobCount = jobCounts[c.id] || 0
            return (
              <Link
                key={c.id}
                to={`/c/${c.slug}`}
                className="card card-hover block group relative overflow-hidden reveal"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-brand-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-brand-500/20">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 size={24} className="text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                        {c.name}
                      </h3>
                      {c.verified && (
                        <BadgeCheck
                          size={14}
                          className="text-blue-600 shrink-0"
                        />
                      )}
                    </div>

                    {c.industry && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {c.industry}
                      </p>
                    )}
                    {c.location && (
                      <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                        <MapPin size={11} /> {c.location}
                      </p>
                    )}
                  </div>
                </div>

                {c.tagline && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {c.tagline}
                  </p>
                )}
                {!c.tagline && c.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {c.description}
                  </p>
                )}

                {jobCount >= 3 && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                    <Zap size={10} /> Hiring Now
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase size={11} />
                    <strong className="text-gray-900">{jobCount}</strong>
                    open {jobCount === 1 ? 'role' : 'roles'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} />
                    <strong className="text-gray-900">
                      {formatCount(c.followerCount)}
                    </strong>
                    {c.followerCount === 1 ? 'follower' : 'followers'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}