import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  Search,
  MapPin,
  ArrowRight,
  Briefcase,
  Sparkles,
  Zap,
  Home,
  Star,
} from 'lucide-react'

const CATEGORIES = [
  { v: '', l: 'All Categories' },
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

const QUICK_PILLS = [
  { icon: Home, label: 'Remote', param: { workMode: 'remote' } },
  { icon: Zap, label: 'Urgent', param: { jobType: 'full_time' } },
  { icon: Star, label: 'Featured', param: {} },
]

const TRENDING = [
  'Software Developer',
  'Accountant',
  'NGO Jobs',
  'Jobs in Lagos',
  'Jobs in Abuja',
  'Remote Jobs',
  'Graduate Trainee',
  'Oil & Gas',
]

export default function HeroSection({ config, stats }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('')
  const [category, setCategory] = useState('')

  const onSearch = (e) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (loc.trim()) params.set('location', loc.trim())
    if (category) params.set('category', category)
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const onQuickPill = (pill) => {
    const params = new URLSearchParams(pill.param || {})
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const onTrending = (tag) => {
    const params = new URLSearchParams()
    // Simple heuristics for trending chip clicks
    if (tag.startsWith('Jobs in ')) {
      params.set('location', tag.replace('Jobs in ', ''))
    } else if (tag === 'Remote Jobs') {
      params.set('workMode', 'remote')
    } else if (tag === 'NGO Jobs') {
      params.set('category', 'Other')
      params.set('q', 'NGO')
    } else {
      params.set('q', tag)
    }
    navigate(`/jobs?${params.toString()}`)
  }

  const liveCount = stats?.activeJobs || stats?.publishedJobs || 0

  return (
    <section className="relative isolate overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-brand-950" />
      <div className="absolute top-10 left-[10%] w-72 h-72 md:w-96 md:h-96 bg-brand-400/25 dark:bg-brand-500/15 rounded-full blur-3xl -z-10 animate-float" />
      <div
        className="absolute bottom-0 right-[5%] w-72 h-72 md:w-96 md:h-96 bg-accent-400/20 dark:bg-accent-500/10 rounded-full blur-3xl -z-10 animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="container-app pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="reveal" style={{ animationDelay: '0.05s' }}>
            <span className="badge bg-white/80 dark:bg-gray-900/80 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 shadow-sm">
              <Sparkles size={13} className="text-accent-500" />
              <span className="font-bold">{config.heroBadge}</span>
              {liveCount > 0 && (
                <>
                  <span className="mx-1 text-gray-400">·</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {liveCount}+ live vacancies
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Title */}
          <h1
            className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-balance reveal"
            style={{ animationDelay: '0.15s' }}
          >
            {config.heroTitle1}{' '}
            <span className="gradient-text-brand">{config.heroTitleAccent}</span>{' '}
            {config.heroTitle2}
            <br className="hidden sm:block" />
            <span className="text-gray-900 dark:text-white">
              {config.heroTitle3}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed text-pretty reveal"
            style={{ animationDelay: '0.25s' }}
          >
            {config.heroSubtitle}
          </p>

          {/* Big CTA buttons */}
          <div
            className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 reveal"
            style={{ animationDelay: '0.35s' }}
          >
            <Link to="/jobs" className="btn-primary group justify-center">
              <Briefcase size={17} />
              {config.primaryCta}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link to="/register" className="btn-outline group justify-center">
              {config.secondaryCta}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Search bar */}
          <form
            onSubmit={onSearch}
            className="mt-10 sm:mt-12 max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl p-1.5 sm:p-2 shadow-xl shadow-brand-900/5 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 reveal-in"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="flex flex-col md:flex-row items-stretch gap-1.5">
              {/* Keyword */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 flex-1 rounded-xl bg-gray-50 dark:bg-gray-950">
                <Search size={17} className="text-brand-600 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Job title, skills, keywords..."
                  className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400 dark:text-white"
                />
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-800 my-2" />

              {/* Category */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 md:w-52 rounded-xl bg-gray-50 dark:bg-gray-950">
                <Briefcase size={16} className="text-brand-600 shrink-0" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full cursor-pointer dark:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.v} value={c.v}>
                      {c.l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-800 my-2" />

              {/* Location */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 flex-1 rounded-xl bg-gray-50 dark:bg-gray-950">
                <MapPin size={17} className="text-brand-600 shrink-0" />
                <input
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  placeholder="Location (Lagos, Abuja, Remote...)"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400 dark:text-white"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary shrink-0 justify-center"
              >
                <Search size={15} />
                Search Jobs
              </button>
            </div>
          </form>

          {/* Quick pills */}
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2 reveal"
            style={{ animationDelay: '0.6s' }}
          >
            {QUICK_PILLS.map((p) => (
              <button
                key={p.label}
                onClick={() => onQuickPill(p)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-full px-3 py-1.5 transition shadow-sm"
              >
                <p.icon size={12} className="text-brand-600" />
                {p.label}
              </button>
            ))}
            <Link
              to="/jobs"
              className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline ml-2"
            >
              More filters →
            </Link>
          </div>

          {/* Trending chips */}
          <div className="mt-10 reveal" style={{ animationDelay: '0.7s' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Trending Searches
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => onTrending(t)}
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-400 border border-transparent hover:border-brand-200 dark:hover:border-brand-800 rounded-full px-3 py-1.5 transition"
                >
                  {t}
                </button>
              ))}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}