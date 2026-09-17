import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { getCompany } from '../services/companyService'
import { listPublishedJobs } from '../services/jobService'

export default function CompanyProfile() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const c = await getCompany(id)
        if (!alive) return
        setCompany(c)
        if (c) {
          const allJobs = await listPublishedJobs(100)
          const own = allJobs.filter((j) => j.companyId === id)
          if (alive) setJobs(own)
        }
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">Company not found</p>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex">
          Browse jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-4xl">
      <Link
        to="/jobs"
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center overflow-hidden shadow-lg shadow-brand-500/30 shrink-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 size={32} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {company.name}
            </h1>
            {company.industry && (
              <p className="text-brand-700 font-semibold mt-1">
                {company.industry}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
              {company.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {company.location}
                </span>
              )}
              {company.companySize && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} /> {company.companySize} employees
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-700 hover:underline"
                >
                  <Globe size={14} /> Website
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {company.description && (
            <div className="card">
              <h2 className="text-lg font-bold mb-3">About</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {company.description}
              </p>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                Open positions ({jobs.length})
              </h2>
              {jobs.length > 0 && (
                <Link
                  to="/jobs"
                  className="text-sm text-brand-700 font-semibold hover:underline"
                >
                  View all jobs
                </Link>
              )}
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase
                  size={32}
                  className="mx-auto text-gray-300 mb-2"
                />
                <p className="text-sm">
                  No open positions right now. Check back later.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {jobs.map((j) => (
                  <Link
                    key={j.id}
                    to={`/jobs/${j.id}`}
                    className="block rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:bg-brand-50/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{j.title}</h3>
                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} /> {j.location || '—'}
                          </span>
                          <span>{j.jobType?.replace('_', ' ')}</span>
                          <span>{j.workMode}</span>
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
        </div>

        <aside className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
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
              {!company.contactEmail && !company.contactPhone && (
                <p className="text-gray-400 text-xs">
                  No contact information provided.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}