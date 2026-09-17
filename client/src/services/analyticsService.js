import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { listMyJobs } from './jobService'
import { getMyCompany } from './companyService'

const sortByCreatedDesc = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })

/**
 * Fetch everything the analytics page needs for an employer.
 * Returns totals, funnel, followers, and per-job stats.
 */
export async function getEmployerAnalytics(uid) {
  const [jobs, appsSnap, company] = await Promise.all([
    listMyJobs(uid),
    getDocs(
      query(collection(db, 'applications'), where('employerId', '==', uid))
    ),
    getMyCompany(uid),
  ])

  const apps = sortByCreatedDesc(
    appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  )

  // Totals
  const totalJobs = jobs.length
  const activeJobs = jobs.filter((j) => j.status === 'published').length
  const totalViews = jobs.reduce((s, j) => s + (j.views || 0), 0)
  const totalApplications = apps.length
  const shortlisted = apps.filter((a) => a.status === 'shortlisted').length
  const interviews = apps.filter((a) => a.status === 'interview').length
  const hires = apps.filter((a) => a.status === 'hired').length
  const rejected = apps.filter((a) => a.status === 'rejected').length
  const pending = apps.filter((a) =>
    ['applied', 'under_review'].includes(a.status)
  ).length

  const conversion =
    totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0

  // Per-job stats
  const jobStats = jobs
    .map((j) => {
      const jobApps = apps.filter((a) => a.jobId === j.id)
      return {
        id: j.id,
        title: j.title,
        status: j.status,
        createdAt: j.createdAt,
        views: j.views || 0,
        applications: jobApps.length,
        shortlisted: jobApps.filter((a) => a.status === 'shortlisted').length,
        interviews: jobApps.filter((a) => a.status === 'interview').length,
        hires: jobApps.filter((a) => a.status === 'hired').length,
        rejected: jobApps.filter((a) => a.status === 'rejected').length,
        conversion:
          (j.views || 0) > 0
            ? Math.round((jobApps.length / (j.views || 1)) * 100)
            : 0,
      }
    })
    .sort((a, b) => b.views - a.views)

  // Recent applications
  const recentApps = apps.slice(0, 5)

  return {
    totals: {
      totalJobs,
      activeJobs,
      totalViews,
      totalApplications,
      shortlisted,
      interviews,
      hires,
      rejected,
      pending,
      conversion,
      followers: company?.followerCount || 0,
    },
    jobStats,
    recentApps,
  }
}