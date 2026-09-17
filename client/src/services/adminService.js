import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

// =========================
// STATS
// =========================
export async function getPlatformStats() {
  const [
    usersSnap,
    employersSnap,
    jobsSnap,
    appsSnap,
    interviewsSnap,
    reportsSnap,
  ] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'users'), where('role', '==', 'employer'))),
    getDocs(query(collection(db, 'jobs'), where('status', '==', 'published'))),
    getDocs(collection(db, 'applications')),
    getDocs(collection(db, 'interviews')),
    getDocs(query(collection(db, 'reports'), where('status', '==', 'open'))),
  ])

  const apps = appsSnap.docs.map((d) => d.data())
  const hires = apps.filter((a) => a.status === 'hired').length

  return {
    users: usersSnap.size,
    employers: employersSnap.size,
    activeJobs: jobsSnap.size,
    applications: appsSnap.size,
    interviews: interviewsSnap.size,
    hires,
    openReports: reportsSnap.size,
  }
}

// =========================
// USERS
// =========================
export async function listAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return users.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })
}

export async function setUserSuspended(uid, suspended, reason = '') {
  await updateDoc(doc(db, 'users', uid), {
    isSuspended: suspended,
    suspensionReason: suspended ? reason : null,
    updatedAt: serverTimestamp(),
  })

  await createNotification({
    userId: uid,
    type: 'system',
    title: suspended ? 'Account suspended' : 'Account reactivated',
    body: suspended
      ? reason || 'Your account has been suspended by an administrator.'
      : 'Your account has been reactivated.',
    link: '',
  })
}

// =========================
// COMPANIES
// =========================
export async function listAllCompanies() {
  const snap = await getDocs(collection(db, 'companies'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Toggle a company's verified status.
 * Also updates companyVerified on every job belonging to that company
 * so job cards can show the badge without extra lookups.
 */
export async function setCompanyVerified(companyId, verified) {
  await updateDoc(doc(db, 'companies', companyId), {
    verified: !!verified,
    verifiedAt: verified ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })

  try {
    const jobsSnap = await getDocs(
      query(collection(db, 'jobs'), where('companyId', '==', companyId))
    )
    if (jobsSnap.empty) return

    const docs = jobsSnap.docs
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500)
      const batch = writeBatch(db)
      chunk.forEach((d) => {
        batch.update(d.ref, { companyVerified: !!verified })
      })
      await batch.commit()
    }
  } catch (err) {
    console.warn('Could not sync verified flag to jobs:', err)
  }
}

// =========================
// JOBS
// =========================
export async function listAllJobs() {
  const snap = await getDocs(collection(db, 'jobs'))
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return jobs.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })
}

export async function adminUpdateJobStatus(jobId, status) {
  await updateDoc(doc(db, 'jobs', jobId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function adminDeleteJob(jobId) {
  await deleteDoc(doc(db, 'jobs', jobId))
}

// =========================
// APPLICATIONS
// =========================
export async function listAllApplications() {
  const snap = await getDocs(collection(db, 'applications'))
  const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return apps.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })
}

// =========================
// REPORTS
// =========================
export async function listAllReports() {
  const snap = await getDocs(collection(db, 'reports'))
  const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return reports.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })
}

export async function updateReportStatus(reportId, status) {
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    updatedAt: serverTimestamp(),
  })
}