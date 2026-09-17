import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  ExternalLink,
  AlertCircle,
  BadgeCheck,
  Zap,
} from 'lucide-react'
import { getCompanyBySlug } from '../services/companyService'
import { listPublishedJobs } from '../services/jobService'
import { friendlyError } from '../utils/errors'
import CompanyFollowButton from '../components/company/CompanyFollowButton'
import CompanyShareMenu from '../components/company/CompanyShareMenu'
import CompanyUpdateFeed from '../components/company/CompanyUpdateFeed'

const TABS = [
  { v: 'about', l: 'About' },
  { v: 'jobs', l: 'Jobs' },
  { v: 'updates', l: 'Updates' },
]

function formatCount(n) {
  const num = Number(n) || 0
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`
  return num.toString()
}

export default function CompanySpace() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('about')
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const c = await getCompanyBySlug(slug)
        if (!alive) return
        if (!c) {
          setError('not-found')
          setLoading(false)
          return
        }
        setCompany(c)

        if (!c.slug) {
          navigate(`/companies/${c.id}`, { replace: true })
          return
        }

        const allJobs = await listPublishedJobs(100)
        const own = allJobs.filter((j) => j.companyId === c.id)
        if (alive) setJobs(own)
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error === 'not-found' || !company) {
    return (
      <div className="container-app py-16 text-center max-w-md">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Company not found</h1>
        <p className="text-sm text-gray-500 mt-2">
          The link may be broken, or this company may have removed their space.
        </p>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex">
          Browse jobs
        </Link>
      </div>
    )
  }

  const publicUrl = `${window.location.origin}/c/${company.slug}`

  return (
    <div className="container-app py-8 max-w-5xl">
      {/* HERO */}
      <div className="card !p-0 overflow-hidden mb-6">
        <div className="relative h-40 sm:h-52 bg-gradient-to-br from-brand-600 to-brand-900">
          {company.coverUrl && (
            <img
              src={company.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-2 sm:pt-16">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {company.name}
                </h1>
                {company.verified && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 text-xs font-semibold">
                    <BadgeCheck size={13} />
                    Verified
                  </span>
                )}
                {jobs.length >= 3 && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-1 text-xs font-semibold">
                    <Zap size={13} />
                    Hiring Now
                  </span>
                )}
              </div>
              {company.tagline && (
                <p className="text-gray-600 mt-1">{company.tagline}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={13} /> {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} /> {company.location}
                  </span>
                )}
                {company.companySize && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} /> {company.companySize} employees
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:pt-16">
              <CompanyFollowButton companyId={company.id} />
              <CompanyShareMenu url={publicUrl} title={company.name} />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="font-bold text-gray-900">{jobs.length}</span>{' '}
              <span className="text-gray-500">
                open {jobs.length === 1 ? 'role' : 'roles'}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-900">
                {formatCount(company.followerCount)}
              </span>{' '}
              <span className="text-gray-500">
                {company.followerCount === 1 ? 'follower' : 'followers'}
              </span>
            </div>
            {company.createdAt?.seconds && (
              <div className="text-gray-500">
                On SkillNest since{' '}
                <span className="font-medium text-gray-700">
                  {new Date(company.createdAt.seconds * 1000).toLocaleDateString(
                    undefined,
                    { month: 'short', year: 'numeric' }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.v
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-brand-700'
            }`}
          >
            {t.l}
            {t.v === 'jobs' && jobs.length > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {jobs.length}
              </span>
            )}
            {t.v === 'updates' && updateCount > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {updateCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ABOUT TAB */}
      {tab === 'about' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {company.description ? (
              <div className="card">
                <h2 className="text-lg font-bold mb-3">About</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {company.description}
                </p>
              </div>
            ) : (
              <div className="card text-center py-10 text-gray-500 text-sm">
                This company hasn't added a description yet.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
                Contact
              </h3>
              <div className="space-y-3 text-sm">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                  >
                    <Globe size={14} className="mt-0.5 shrink-0" />
                    <span className="truncate">
                      {company.website.replace(/^https?:\/\//, '')}
                    </span>
                    <ExternalLink size={11} className="shrink-0 mt-0.5" />
                  </a>
                )}
                {company.contactEmail && (
                  <a
                    href={`mailto:${company.contactEmail}`}
                    className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                  >
                    <Mail size={14} className="mt-0.5 shrink-0" />
                    <span className="truncate">{company.contactEmail}</span>
                  </a>
                )}
                {company.contactPhone && (
                  <span className="flex items-start gap-2 text-gray-700">
                    <Phone size={14} className="mt-0.5 shrink-0" />
                    <span>{company.contactPhone}</span>
                  </span>
                )}
                {!company.website &&
                  !company.contactEmail &&
                  !company.contactPhone && (
                    <p className="text-gray-400 text-xs">
                      No contact info provided.
                    </p>
                  )}
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
                At a glance
              </h3>
              <dl className="space-y-2.5 text-sm">
                {company.industry && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Industry</dt>
                    <dd className="font-medium text-gray-800 text-right">
                      {company.industry}
                    </dd>
                  </div>
                )}
                {company.companySize && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Size</dt>
                    <dd className="font-medium text-gray-800 text-right">
                      {company.companySize}
                    </dd>
                  </div>
                )}
                {company.location && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-800 text-right">
                      {company.location}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      )}

      {/* JOBS TAB */}
      {tab === 'jobs' && (
        <div>
          {jobs.length === 0 ? (
            <div className="card text-center py-16">
              <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">No open positions</p>
              <p className="text-sm text-gray-500 mt-1">
                {company.name} isn't hiring right now. Follow to get notified
                when they post.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((j) => (
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
                    </div>
                    <span className="text-xs font-semibold text-brand-700 shrink-0">
                      View →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPDATES TAB */}
      {tab === 'updates' && (
        <CompanyUpdateFeed
          companyId={company.id}
          companyOwnerId={company.ownerId}
          onCountChange={setUpdateCount}
        />
      )}
    </div>
  )
}