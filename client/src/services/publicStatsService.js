import {
  collection,
  getCountFromServer,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COUNTERS_DOC_ID = 'counters'

/**
 * Read the public counters doc (fast, no permissions issues).
 * Silently falls back if rules block it.
 */
export async function getPublicStats() {
  let stored = null
  try {
    const snap = await getDoc(doc(db, 'platformStats', COUNTERS_DOC_ID))
    if (snap.exists()) stored = snap.data()
  } catch {
    // Rules not published — silent fallback
  }

  const safe = async (fn, fallback = 0) => {
    try {
      const v = await fn()
      return typeof v === 'number' ? v : fallback
    } catch {
      return fallback
    }
  }

  const [totalJobs, activeJobs, totalCompanies, verifiedCompanies] =
    await Promise.all([
      safe(async () =>
        (await getCountFromServer(collection(db, 'jobs'))).data().count
      ),
      safe(async () =>
        (
          await getCountFromServer(
            query(collection(db, 'jobs'), where('status', '==', 'published'))
          )
        ).data().count
      ),
      safe(async () =>
        (await getCountFromServer(collection(db, 'companies'))).data().count
      ),
      safe(async () =>
        (
          await getCountFromServer(
            query(collection(db, 'companies'), where('verified', '==', true))
          )
        ).data().count
      ),
    ])

  const stats = {
    totalJobs,
    activeJobs,
    totalCompanies,
    verifiedCompanies,
    totalSeekers: stored?.totalSeekers ?? 0,
    totalEmployers: stored?.totalEmployers ?? 0,
    totalApplications: stored?.totalApplications ?? 0,
    totalHires: stored?.totalHires ?? 0,
    avgRating: stored?.avgRating ?? 4.8,
    hireRate:
      stored?.totalApplications > 0
        ? Math.round((stored.totalHires / stored.totalApplications) * 100)
        : 0,
    lastUpdated: stored?.updatedAt || null,
  }

  stats.display = {
    jobs: formatCount(stats.activeJobs || stats.totalJobs),
    companies: formatCount(stats.verifiedCompanies || stats.totalCompanies),
    seekers: formatCount(stats.totalSeekers),
    employers: formatCount(stats.totalEmployers),
    applications: formatCount(stats.totalApplications),
    rating: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '4.8',
  }

  return stats
}

function formatCount(n) {
  const num = Number(n) || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

/**
 * Admin action — recompute and save public stats. Silent on failure.
 */
export async function refreshPublicStats() {
  const safe = async (fn, fallback = 0) => {
    try {
      const v = await fn()
      return typeof v === 'number' ? v : fallback
    } catch {
      return fallback
    }
  }

  const [
    totalJobs,
    activeJobs,
    totalCompanies,
    verifiedCompanies,
    totalSeekers,
    totalEmployers,
    totalApplications,
    totalHires,
  ] = await Promise.all([
    safe(async () =>
      (await getCountFromServer(collection(db, 'jobs'))).data().count
    ),
    safe(async () =>
      (
        await getCountFromServer(
          query(collection(db, 'jobs'), where('status', '==', 'published'))
        )
      ).data().count
    ),
    safe(async () =>
      (await getCountFromServer(collection(db, 'companies'))).data().count
    ),
    safe(async () =>
      (
        await getCountFromServer(
          query(collection(db, 'companies'), where('verified', '==', true))
        )
      ).data().count
    ),
    safe(async () =>
      (
        await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'job_seeker'))
        )
      ).data().count
    ),
    safe(async () =>
      (
        await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'employer'))
        )
      ).data().count
    ),
    safe(async () =>
      (await getCountFromServer(collection(db, 'applications'))).data().count
    ),
    safe(async () =>
      (
        await getCountFromServer(
          query(collection(db, 'applications'), where('status', '==', 'hired'))
        )
      ).data().count
    ),
  ])

  const payload = {
    totalJobs,
    activeJobs,
    totalCompanies,
    verifiedCompanies,
    totalSeekers,
    totalEmployers,
    totalApplications,
    totalHires,
    updatedAt: serverTimestamp(),
  }

  try {
    await setDoc(doc(db, 'platformStats', COUNTERS_DOC_ID), payload, {
      merge: true,
    })
  } catch {
    // Rules block — caller will get the payload anyway
  }

  return payload
}