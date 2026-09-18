import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { listMySavedSearches, matchesSearch, markSearchAlerted } from '../services/savedSearchService'
import { listPublishedJobs } from '../services/jobService'
import { createNotification } from '../services/notificationService'

const LOOKBACK_DAYS = 7

export function useJobAlerts() {
  const { user, profile } = useAuth()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (!user || profile?.role !== 'job_seeker') return
    if (hasRunRef.current) return // run once per session

    let alive = true
    ;(async () => {
      try {
        const searches = await listMySavedSearches(user.uid)
        const enabled = searches.filter((s) => s.enabled !== false)
        if (enabled.length === 0) return

        const jobs = await listPublishedJobs(200)
        const now = Date.now()
        const lookbackMs = LOOKBACK_DAYS * 24 * 60 * 60 * 1000

        for (const search of enabled) {
          if (!alive) return
          const sinceMs = search.lastAlertAt?.seconds
            ? search.lastAlertAt.seconds * 1000
            : now - lookbackMs

          const matches = jobs.filter((j) => {
            const createdAtMs = (j.createdAt?.seconds || 0) * 1000
            if (createdAtMs <= sinceMs) return false
            return matchesSearch(j, search)
          })

          if (matches.length === 0) continue

          const preview = matches[0]
          const body =
            matches.length === 1
              ? `${preview.title} at ${preview.companyName}`
              : `${matches.length} new jobs match your search "${search.name}". First: ${preview.title}.`

          try {
            await createNotification({
              userId: user.uid,
              type: 'new_job',
              title: `🔔 New jobs for "${search.name}"`,
              body,
              link: '/jobs?highlight=1',
            })
            await markSearchAlerted(search.id)
          } catch {
            /* best-effort */
          }
        }

        hasRunRef.current = true
      } catch (err) {
        console.warn('Job alerts check failed:', err)
      }
    })()

    return () => {
      alive = false
    }
  }, [user, profile])
}