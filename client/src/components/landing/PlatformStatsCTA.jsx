import {
  Briefcase,
  Building2,
  Users,
  MapPin,
  Sparkles,
  Search,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PlatformStatsCTA({ stats }) {
  const s = stats || {}
  const display = s.display || {}

  const items = [
    {
      value: display.jobs || '0',
      label: 'Active Jobs',
      icon: Briefcase,
    },
    {
      value: display.companies || '0',
      label: 'Verified Companies',
      icon: Building2,
    },
    {
      value: display.seekers || '0',
      label: 'Job Seekers',
      icon: Users,
    },
    {
      value: '36',
      label: 'States Covered',
      icon: MapPin,
    },
    {
      value: 'Free',
      label: 'Free to Apply',
      icon: Sparkles,
    },
  ]

  return (
    <section className="relative overflow-hidden bg-brand-gradient text-white py-14 md:py-20">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.4),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.3),transparent_45%)]" />

      <div className="container-app relative">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 text-center">
          {items.map((it) => (
            <div key={it.label}>
              <div className="flex justify-center mb-2">
                <it.icon size={20} className="text-white/80" />
              </div>
              <p className="text-3xl md:text-4xl font-extrabold leading-none text-white">
                {it.value}
                {(it.label === 'Active Jobs' ||
                  it.label === 'Verified Companies' ||
                  it.label === 'Job Seekers') &&
                  it.value !== '0' && (
                    <span className="text-white/60 text-2xl">+</span>
                  )}
              </p>
              <p className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/75">
                {it.label}
              </p>
            </div>
          ))}
        </div>

        {/* Big statement */}
        <div className="max-w-3xl mx-auto text-center mt-14">
          <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-balance leading-snug text-white/95">
            Nigeria&apos;s most trusted job platform — find verified vacancies
            updated daily across Lagos, Abuja, Port Harcourt and all 36 states.
          </p>
          <p className="mt-4 text-white/75 text-sm md:text-base">
            Free to search. Free to apply. Free to post a job.
          </p>

          {/* Quick CTA pills */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Search size={16} />
              Find Jobs in Nigeria
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-bold px-6 py-3 rounded-xl border border-white/25 backdrop-blur hover:bg-white/25 hover:-translate-y-0.5 transition-all"
            >
              Post a Job — It&apos;s Free
            </Link>
            <Link
              to="/resume"
              className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-bold px-6 py-3 rounded-xl border border-white/25 backdrop-blur hover:bg-white/25 hover:-translate-y-0.5 transition-all"
            >
              Build Free CV
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 backdrop-blur">
              ✅ Verified Nigerian Job Portal
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 backdrop-blur">
              🔒 NDPR Compliant · Secure HTTPS
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 backdrop-blur">
              ⭐ {display.rating || '4.8'}/5 Trusted by Nigerians
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 backdrop-blur">
              💯 100% Free
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}