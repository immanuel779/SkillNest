import { useEffect, useState } from 'react'
import { ExternalLink, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { listActiveAds } from '../../services/landingService'

export default function AdvertisementBanner({ config }) {
  const [ads, setAds] = useState([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = await listActiveAds(6)
      if (alive) setAds(list)
    })()
    return () => {
      alive = false
    }
  }, [])

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (ads.length <= 1) return
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % ads.length)
    }, 8000)
    return () => clearInterval(t)
  }, [ads.length])

  if (!config?.showAds || ads.length === 0) return null

  const ad = ads[idx]
  if (!ad) return null

  const go = (dir) => {
    setIdx((i) => (i + dir + ads.length) % ads.length)
  }

  return (
    <section className="container-app py-10 md:py-14">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        {/* Small "AD" label */}
        <div className="absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-white/90 dark:bg-gray-900/90 rounded px-1.5 py-0.5">
          Advertisement
        </div>

        <div className="flex flex-col md:flex-row items-stretch">
          {/* Logo */}
          <div className="shrink-0 w-full md:w-52 h-32 md:h-auto bg-gradient-to-br from-brand-50 to-accent-50/60 dark:from-brand-950 dark:to-gray-900 flex items-center justify-center p-6">
            {ad.logoUrl ? (
              <img
                src={ad.logoUrl}
                alt={ad.brand || 'Ad'}
                className="max-h-20 max-w-full object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                <Sparkles size={26} className="text-brand-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-7 min-w-0">
            {ad.brand && (
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                {ad.brand}
              </p>
            )}
            <h3 className="mt-1 text-lg md:text-xl font-bold text-gray-900 dark:text-white text-balance">
              {ad.headline}
            </h3>
            {ad.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {ad.description}
              </p>
            )}
            {ad.subtext && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                {ad.subtext}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="shrink-0 p-5 md:p-7 flex items-center md:items-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
            <a
              href={ad.url || '#'}
              target="_blank"
              rel="noreferrer noopener sponsored"
              className="btn-outline group whitespace-nowrap"
            >
              {ad.cta || 'Learn More'}
              <ExternalLink
                size={14}
                className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
              />
            </a>
          </div>
        </div>

        {/* Controls */}
        {ads.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center text-gray-600 hover:text-brand-700 transition"
              aria-label="Previous ad"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center text-gray-600 hover:text-brand-700 transition"
              aria-label="Next ad"
            >
              <ChevronRight size={14} />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === idx
                      ? 'bg-brand-600 w-4'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  aria-label={`Go to ad ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}