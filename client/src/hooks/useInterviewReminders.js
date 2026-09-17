import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { listMyInterviews, updateInterview } from '../services/interviewService'
import { createNotification } from '../services/notificationService'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function useInterviewReminders() {
  const { user, profile } = useAuth()

  useEffect(() => {
    if (!user || !profile) return
    let alive = true

    ;(async () => {
      try {
        const interviews = await listMyInterviews(user.uid, profile.role)
        const now = Date.now()

        for (const iv of interviews) {
          if (!alive) return
          if (iv.status !== 'scheduled') continue
          if (iv.reminderSent) continue

          const t = iv.scheduledAt?.seconds ? iv.scheduledAt.seconds * 1000 : null
          if (!t) continue

          const diff = t - now
          if (diff > 0 && diff <= ONE_DAY_MS) {
            await createNotification({
              userId: user.uid,
              type: 'interview',
              title: '⏰ Interview reminder',
              body: `Your interview for "${iv.jobTitle}" is within 24 hours.`,
              link: `/interviews/${iv.id}`,
            })
            try {
              await updateInterview(iv.id, { reminderSent: true })
            } catch {
              /* best-effort */
            }
          }
        }
      } catch (err) {
        console.warn('Interview reminder check failed:', err)
      }
    })()

    return () => {
      alive = false
    }
  }, [user, profile])
}