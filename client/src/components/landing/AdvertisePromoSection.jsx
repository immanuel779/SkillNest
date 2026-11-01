import { Link } from 'react-router-dom'
import { Megaphone, ArrowRight, TrendingUp, Target, Sparkles } from 'lucide-react'

export default function AdvertisePromoSection() {
  return (
    <section className="container-app py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-brand-900 to-brand-800 text-white p-8 md:p-12 shadow-2xl">
        {/* Decorative gradients */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <span className="badge bg-white/10 border border-white/20 text-white backdrop-blur">
              <Megaphone size={12} /> For businesses
            </span>

            <h2 className="mt-5 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance leading-tight">
              Put your brand in front of{' '}
              <span className="text-accent-300">thousands</span> of Nigerian
              job seekers
            </h2>

            <p className="mt-5 text-white/75 text-lg leading-relaxed">
              Promote your product, service, or hiring brand directly on
              SkillNest. Simple packages, transparent pricing, no hidden fees.
              Submit your ad in 3 minutes — approved within 24 hours.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/advertise"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-800 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Megaphone size={16} />
                Advertise now
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/advertise"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 backdrop-blur text-white font-bold px-6 py-3.5 rounded-xl hover:bg-white/20 hover:-translate-y-0.5 transition-all"
              >
                See pricing
              </Link>
            </div>
          </div>

          {/* Right — feature bullets */}
          <div className="space-y-3">
            {[
              {
                icon: Target,
                title: 'Precise targeting',
                text: 'Reach verified job seekers, employers, and graduates across all 36 states.',
              },
              {
                icon: TrendingUp,
                title: 'Real metrics',
                text: 'Track views and clicks in real-time from your advertiser dashboard.',
              },
              {
                icon: Sparkles,
                title: 'Admin-reviewed',
                text: 'Every ad is quality-checked to keep the platform clean for users.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-4 hover:bg-white/10 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon size={18} className="text-accent-300" />
                </div>
                <div>
                  <p className="font-bold text-white">{f.title}</p>
                  <p className="text-sm text-white/70 mt-0.5">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}