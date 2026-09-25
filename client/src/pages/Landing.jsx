
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Briefcase, TrendingUp, Users, ShieldCheck,
  MessageSquare, CalendarCheck, ArrowRight, Sparkles, Building2,
  Star, CheckCircle2, Zap, BadgeCheck,
} from 'lucide-react'
import { listFeaturedCompanies } from '../services/companyService'
import { listPublishedJobs } from '../services/jobService'

const featuredJobs = [
  {
    title: 'Senior Frontend Engineer',
    company: 'Nova Labs',
    location: 'Remote · Worldwide',
    type: 'Full-time',
    salary: '$90k – $130k',
    tags: ['React', 'TypeScript', 'Tailwind'],
    accent: 'brand',
  },
  {
    title: 'Product Designer',
    company: 'Pixelform',
    location: 'Lagos, Nigeria',
    type: 'Hybrid',
    salary: '$60k – $85k',
    tags: ['Figma', 'UX', 'Design Systems'],
    accent: 'accent',
  },
  {
    title: 'Backend Engineer (Node.js)',
    company: 'CloudForge',
    location: 'Remote · Africa',
    type: 'Full-time',
    salary: '$75k – $110k',
    tags: ['Node.js', 'PostgreSQL', 'AWS'],
    accent: 'brand',
  },
]

const whyFeatures = [
  { icon: ShieldCheck, title: 'Verified Employers', text: 'Every company is reviewed so you apply with confidence.' },
  { icon: Zap, title: 'Fast Applications', text: 'Apply in seconds using your SkillNest profile.' },
  { icon: MessageSquare, title: 'Direct Messaging', text: 'Chat directly with hiring managers.' },
  { icon: CalendarCheck, title: 'Interview Scheduling', text: 'Book and track interviews without leaving the app.' },
  { icon: TrendingUp, title: 'Application Tracking', text: 'Know exactly where you stand at every stage.' },
  { icon: Users, title: 'Built for Everyone', text: 'Job seekers, employers, and admins in one workspace.' },
]

export default function Landing() {
  const [featured, setFeatured] = useState([])
  const [companyJobCounts, setCompanyJobCounts] = useState({})

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [companies, jobs] = await Promise.all([
          listFeaturedCompanies(6),
          listPublishedJobs(200),
        ])
        if (!alive) return
        setFeatured(companies)

        const counts = {}
        jobs.forEach((j) => {
          counts[j.companyId] = (counts[j.companyId] || 0) + 1
        })
        setCompanyJobCounts(counts)
      } catch {
        /* silent */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="overflow-hidden">
      {/* ============================
          HERO
          ============================ */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-50/50" />
        <div className="absolute top-10 left-[10%] w-72 h-72 md:w-96 md:h-96 bg-brand-400/25 rounded-full blur-3xl -z-10 animate-float" />
        <div
          className="absolute bottom-0 right-[5%] w-72 h-72 md:w-96 md:h-96 bg-accent-400/20 rounded-full blur-3xl -z-10 animate-float-slow"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-64 h-64 bg-brand-300/20 rounded-full blur-3xl -z-10 animate-float"
          style={{ animationDelay: '3s' }}
        />

        <div className="container-app pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="reveal" style={{ animationDelay: '0.05s' }}>
              <span className="badge bg-white/80 border border-brand-200 text-brand-700 shadow-sm">
                <Sparkles size={14} className="text-accent-500" />
                Trusted by 10,000+ professionals
              </span>
            </div>

            <h1
              className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-balance reveal"
              style={{ animationDelay: '0.15s' }}
            >
              Where <span className="gradient-text-brand">Talent</span> Meets
              <br className="hidden sm:block" /> Opportunity
            </h1>

            <p
              className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-pretty reveal"
              style={{ animationDelay: '0.25s' }}
            >
              SkillNest connects ambitious job seekers with world-class employers in one
              seamless workspace. Discover roles, apply in seconds, and get hired faster.
            </p>

            <div
              className="mt-9 flex flex-col sm:flex-row justify-center gap-4 reveal"
              style={{ animationDelay: '0.35s' }}
            >
              <Link to="/register" className="btn-primary group">
                Find Jobs
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register" className="btn-accent group">
                Post a Job
                <Briefcase size={18} className="group-hover:rotate-6 transition-transform" />
              </Link>
            </div>

            <div
              className="mt-12 max-w-3xl mx-auto glass rounded-2xl p-2 shadow-xl shadow-brand-900/5 reveal-in"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex flex-col md:flex-row items-stretch gap-2">
                <div className="flex items-center gap-2 px-4 py-3 flex-1 rounded-xl bg-white/70">
                  <Search size={18} className="text-brand-600 shrink-0" />
                  <input
                    placeholder="Job title, keyword, or skill"
                    className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
                  />
                </div>
                <div className="hidden md:block w-px bg-gray-200/80 my-2" />
                <div className="flex items-center gap-2 px-4 py-3 flex-1 rounded-xl bg-white/70">
                  <MapPin size={18} className="text-brand-600 shrink-0" />
                  <input
                    placeholder="Location"
                    className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
                  />
                </div>
                <Link to="/register" className="btn-primary shrink-0">
                  <Search size={16} />
                  Search
                </Link>
              </div>
            </div>

            <div
              className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto reveal"
              style={{ animationDelay: '0.6s' }}
            >
              {[
                { label: 'Active Jobs', value: '12k+' },
                { label: 'Companies', value: '3,500+' },
                { label: 'Hires Made', value: '48k+' },
                { label: 'Countries', value: '120+' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold gradient-text">
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          HOW IT WORKS
          ============================ */}
      <section className="container-app py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
            Two paths. One <span className="gradient-text">powerful</span> platform.
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Whether you're searching for your next role or building a team, SkillNest
            makes the process effortless.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="card card-hover relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-400/15 rounded-full blur-2xl group-hover:bg-brand-400/25 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
                <Search size={22} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">For Job Seekers</h3>
              <p className="mt-2 text-gray-600">
                Find the right role, apply in seconds, and track every step.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  { t: 'Create your profile', d: 'Add skills, experience, and your resume.' },
                  { t: 'Discover curated jobs', d: 'Search and filter roles that match you.' },
                  { t: 'Apply & get hired', d: 'Track applications and chat with employers.' },
                ].map((step, i) => (
                  <li key={step.t} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{step.t}</div>
                      <div className="text-sm text-gray-500">{step.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/register" className="btn-outline mt-7 w-full group/btn">
                Start as a Job Seeker
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="card card-hover relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent-400/15 rounded-full blur-2xl group-hover:bg-accent-400/25 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30 mb-5">
                <Building2 size={22} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">For Employers</h3>
              <p className="mt-2 text-gray-600">
                Post jobs, review candidates, and hire top talent faster.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  { t: 'Create your company', d: 'Showcase your brand to candidates.' },
                  { t: 'Post a job', d: 'Publish roles in minutes with smart fields.' },
                  { t: 'Review & hire', d: 'Manage applicants, message, and schedule interviews.' },
                ].map((step, i) => (
                  <li key={step.t} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-accent-100 text-accent-700 font-bold flex items-center justify-center text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{step.t}</div>
                      <div className="text-sm text-gray-500">{step.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/register" className="btn-accent mt-7 w-full group/btn">
                Start Hiring
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          FEATURED COMPANIES
          ============================ */}
      {featured.length > 0 && (
        <section className="relative py-20 md:py-24 bg-white">
          <div className="container-app">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
                  Featured Companies
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance max-w-xl">
                  Meet the teams <span className="gradient-text">hiring now</span>
                </h2>
                <p className="mt-4 text-gray-600 text-lg max-w-lg">
                  Follow companies you love. Get notified the moment they post a new role.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((c, i) => {
                const jobCount = companyJobCounts[c.id] || 0
                return (
                  <Link
                    key={c.id}
                    to={`/c/${c.slug}`}
                    className="card card-hover block group relative overflow-hidden reveal"
                    style={{ animationDelay: `${0.05 + i * 0.06}s` }}
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
                            <BadgeCheck size={14} className="text-blue-600 shrink-0" />
                          )}
                          {jobCount >= 3 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5">
                              <Zap size={9} /> Hiring
                            </span>
                          )}
                        </div>
                        {c.industry && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {c.industry}
                          </p>
                        )}
                        {c.tagline && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {c.tagline}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <strong className="text-gray-900">{jobCount}</strong>{' '}
                            open {jobCount === 1 ? 'role' : 'roles'}
                          </span>
                          <span>
                            <strong className="text-gray-900">
                              {c.followerCount || 0}
                            </strong>{' '}
                            followers
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-10 text-center">
              <Link to="/companies" className="btn-outline">
                Browse all companies
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================
          FEATURED JOBS
          ============================ */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white via-brand-50/40 to-white">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <span className="badge bg-accent-50 text-accent-700 border border-accent-100">
                Featured Jobs
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance max-w-xl">
                Fresh roles from <span className="gradient-text">top companies</span>
              </h2>
            </div>
            <Link
              to="/jobs"
              className="btn-ghost self-start sm:self-end group"
            >
              View all jobs
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job, i) => (
              <Link
                key={job.title}
                to="/jobs"
                className="card card-hover group block relative overflow-hidden reveal"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div
                  className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    job.accent === 'brand' ? 'bg-brand-400/25' : 'bg-accent-400/25'
                  }`}
                />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
                        job.accent === 'brand'
                          ? 'bg-brand-gradient shadow-brand-500/30'
                          : 'bg-gradient-to-br from-accent-500 to-accent-600 shadow-accent-500/30'
                      }`}
                    >
                      <Briefcase size={18} className="text-white" />
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">
                      {job.type}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{job.company}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} /> {job.location}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100 rounded-md px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{job.salary}</span>
                    <span className="text-xs font-semibold text-brand-600 group-hover:text-accent-600 transition-colors inline-flex items-center gap-1">
                      Browse
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          WHY SKILLNEST
          ============================ */}
      <section className="container-app py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
            Why SkillNest
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
            Everything you need to <span className="gradient-text">get hired</span>
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Built for the modern job hunt — clear, fast, and beautifully simple.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyFeatures.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover group reveal"
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 group-hover:bg-brand-gradient group-hover:text-white group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300">
                <f.icon size={22} />
              </div>
              <h3 className="mt-5 font-bold text-gray-900 text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================
          SPLIT CTA
          ============================ */}
      <section className="container-app pb-20 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 md:p-12 text-white shadow-2xl shadow-brand-900/20">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 backdrop-blur">
                <Star size={13} className="text-accent-300" />
                For Job Seekers
              </div>
              <h3 className="mt-5 text-2xl md:text-3xl font-extrabold text-balance">
                Your next role is one click away.
              </h3>
              <p className="mt-3 text-white/80 leading-relaxed">
                Join thousands of professionals finding meaningful work on SkillNest.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['Free forever', 'Apply in seconds', 'Track every application'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle2 size={16} className="text-accent-300 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 bg-white text-brand-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Create free account
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-10 md:p-12 text-white shadow-2xl shadow-gray-900/30">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-500/25 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand-500/25 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 badge bg-white/10 text-white border border-white/15 backdrop-blur">
                <Building2 size={13} className="text-accent-300" />
                For Employers
              </div>
              <h3 className="mt-5 text-2xl md:text-3xl font-extrabold text-balance">
                Hire top talent without the noise.
              </h3>
              <p className="mt-3 text-white/70 leading-relaxed">
                Post jobs, review applicants, and schedule interviews — all in one place.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['Post jobs in minutes', 'Smart applicant pipeline', 'Built-in messaging'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-white/85">
                    <CheckCircle2 size={16} className="text-accent-400 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                Post a job
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          FINAL CTA
          ============================ */}
      <section className="container-app pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-8 py-16 md:py-20 text-center shadow-2xl shadow-brand-900/30">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.35),transparent_50%)]" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 backdrop-blur">
              <Sparkles size={13} className="text-accent-300" />
              Ready when you are
            </div>
            <h2 className="mt-5 text-3xl md:text-5xl font-extrabold text-white text-balance leading-tight">
              Start building your future today
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
              Free to join. Powerful for everyone. Take the first step now.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-800 font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-7 py-3.5 rounded-xl border border-white/20 backdrop-blur hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    
  )
}