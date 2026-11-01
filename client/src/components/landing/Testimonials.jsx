import { useEffect, useState } from 'react'
import { Star, Quote } from 'lucide-react'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'

export default function Testimonials() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const q = query(
          collection(db, 'companyReviews'),
          where('status', '==', 'approved'),
          limit(6)
        )
        const snap = await getDocs(q)
        if (!alive) return
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.comment || r.text)
          .slice(0, 3)
        setReviews(list)
      } catch {
        /* silent */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="container-app py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
          Real Reviews
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
          Loved by <span className="gradient-text">job seekers</span>
        </h2>
        <p className="mt-4 text-gray-600 text-lg">
          Verified reviews from candidates who reached the interview stage.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => {
          const name = r.authorName || r.reviewerName || 'Anonymous'
          const initial = name[0]?.toUpperCase() || '?'
          const body = r.comment || r.text || ''
          const rating = r.rating || 5
          return (
            <div
              key={r.id}
              className="card reveal relative"
              style={{ animationDelay: `${0.05 + i * 0.1}s` }}
            >
              <Quote
                size={32}
                className="absolute top-5 right-5 text-brand-100"
              />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star
                    key={k}
                    size={14}
                    className={
                      k < rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-200'
                    }
                  />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                "{body.slice(0, 220)}"
              </p>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {name}
                  </p>
                  {r.role && (
                    <p className="text-xs text-gray-500 truncate">{r.role}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}