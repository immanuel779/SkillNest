import { useEffect, useState } from 'react'
import { Briefcase, Building2, TrendingUp, Users } from 'lucide-react'
import {
  collection,
  getCountFromServer,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../config/firebase'

export default function LiveStats() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    companies: 0,
    newThisWeek: 0,
    followers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        // Safe wrapper so one failed query doesn't break the others
        const safeCount = async (q) => {
          try {
            const snap = await getCountFromServer(q)
            return snap.data().count
          } catch (err) {
            console.warn('Stats query failed:', err.message)
            return 0
          }
        }

        const [activeJobs, companies, newThisWeek, followers] =
          await Promise.all([
            safeCount(
              query(collection(db, 'jobs'), where('status', '==', 'published'))
            ),
            safeCount(collection(db, 'companies')),
            safeCount(
              query(
                collection(db, 'jobs'),
                where('status', '==', 'published'),
                where('createdAt', '>=', oneWeekAgo)
              )
            ),
            safeCount(collection(db, 'companyFollowers')),
          ])

        if (!alive) return
        setStats({ activeJobs, companies, newThisWeek, followers })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const items = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase },
    { label: 'Companies', value: stats.companies, icon: Building2 },
    { label: 'New This Week', value: stats.newThisWeek, icon: TrendingUp },
    { label: 'Followers', value: stats.followers, icon: Users },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center text-center">
            <div className="mb-2 text-brand-800">
              <item.icon size={22} strokeWidth={2.5} />
            </div>
            <div className="text-4xl md:text-5xl font-extrabold text-brand-900 tracking-tight flex items-baseline">
              {loading ? (
                <span className="opacity-40 animate-pulse">—</span>
              ) : (
                item.value
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}