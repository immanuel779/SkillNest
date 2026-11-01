import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Star, Zap } from 'lucide-react'
import { listPublishedJobs } from '../../services/jobService'

const ICON_MAP = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  star: Star,
  zap: Zap,
}

export default function TopTickerEnhanced({ config }) {
  const [jobs, setJobs] = useState([])

  // Load 10 freshest jobs for the "Now Hiring" scroller
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listPublishedJobs(20)
        if (!alive) return
        // Take the 10 newest
        setJobs(list.slice(0, 10))
      } catch {
        /* silent */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const badges = config?.tickerBadges || [
    { icon: 'sparkles', label: 'Free' },
    { icon: 'shield', label: 'Verified' },
    { icon: 'star', label: '4.8★' },
  ]

  const hasJobs = jobs.length > 0

  return (
    <div className="w-full bg-gray-900 dark:bg-black text-white">
      {/* Row 1 — trust badges */}
      <div className="border-b border-white/5">
        <div className="container-app">
          <div className="flex items-center justify-center gap-4 sm:gap-8 py-2 text-[11px] sm:text-xs">
            {badges.map((b, i) => {
              const Icon = ICON_MAP[b.icon] || Sparkles
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon
                    size={11}
                    className={
                      i === 0
                        ? 'text-accent-400'
                        : i === 1
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }
                  />
                  <span className="font-semibold text-white/90">{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2 — Now Hiring scroller */}
      {hasJobs && (
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 dark:from-brand-900 dark:via-brand-900 dark:to-black">
          <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-brand-800 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-brand-900 to-transparent z-10 pointer-events-none" />

          <div className="flex items-center gap-2 sm:gap-3 py-2 relative">
            <div className="shrink-0 ml-3 sm:ml-6 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/95">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-green-400" />
              </span>
              <span className="hidden sm:inline">Now Hiring</span>
              <span className="sm:hidden">Hiring</span>
            </div>

            <div className="flex-1 overflow-hidden group">
              <div className="ticker-track flex gap-6 sm:gap-8 animate-ticker">
                {[...jobs, ...jobs].map((j, i) => (
                  <Link
                    key={`${j.id}-${i}`}
                    to={`/jobs/${j.id}`}
                    className="shrink-0 text-[11px] sm:text-xs font-medium text-white/85 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <span className="text-accent-300 font-bold">{j.title}</span>
                    {j.companyName && (
                      <span className="ml-2 text-white/60">
                        at {j.companyName}
                      </span>
                    )}
                    {j.location && (
                      <span className="ml-2 text-white/45">· {j.location}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/jobs"
              className="shrink-0 mr-3 sm:mr-6 text-[10px] sm:text-[11px] font-bold text-white/90 hover:text-white whitespace-nowrap border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/10 transition"
            >
              Apply Free →
            </Link>
          </div>
        </div>
      )}

      {/* Inline keyframes for the scroller */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker-scroll 45s linear infinite;
          will-change: transform;
        }
        .group:hover .animate-ticker {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}