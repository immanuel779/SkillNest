import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin, ArrowRight } from 'lucide-react'
import { listPublishedJobs } from '../../services/jobService'
import { formatSalaryRange } from '../../utils/currency'

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    let alive = true
    listPublishedJobs(6).then((list) => {
      if (alive) setJobs(list.slice(0, 6))
    })
    return () => {
      alive = false
    }
  }, [])

  if (jobs.length === 0) return null

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-white via-brand-50/40 to-white">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="badge bg-accent-50 text-accent-700 border border-accent-100">
              Fresh Jobs
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance max-w-xl">
              Latest roles from{' '}
              <span className="gradient-text">top companies</span>
            </h2>
          </div>
          <Link to="/jobs" className="btn-ghost self-start sm:self-end group">
            View all jobs
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((j, i) => {
            const salary = formatSalaryRange(
              j.currency,
              j.salaryMin,
              j.salaryMax
            )
            return (
              <Link
                key={j.id}
                to={`/jobs/${j.id}`}
                className="card card-hover group block relative overflow-hidden reveal"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-400/25 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md shadow-brand-500/30">
                      <Briefcase size={18} className="text-white" />
                    </div>
                    {j.jobType && (
                      <span className="badge bg-gray-100 text-gray-600 capitalize">
                        {j.jobType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {j.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {j.companyName}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} /> {j.location || 'Remote'}
                    </span>
                    {j.workMode && (
                      <span className="capitalize">{j.workMode}</span>
                    )}
                  </div>

                  {j.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100 rounded-md px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {salary && (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">
                        {salary}
                      </span>
                      <span className="text-xs font-semibold text-brand-600 group-hover:text-accent-600 transition-colors inline-flex items-center gap-1">
                        View
                        <ArrowRight
                          size={12}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}