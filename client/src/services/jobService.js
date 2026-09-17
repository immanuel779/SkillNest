import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  limit,
  setDoc,
  increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { notifyAdmins, notifyCompanyFollowers } from './notificationService'

const sortByCreatedDesc = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })

export async function createJob(uid, companyId, companyName, data) {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...data,
    ownerId: uid,
    companyId,
    companyName,
    applicantCount: 0,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (data.status === 'published') {
    await notifyAdmins({
      type: 'admin_new_job',
      title: '💼 New job posted',
      body: `${companyName} published "${data.title}".`,
      link: '/admin/jobs',
    })

    await notifyCompanyFollowers(companyId, {
      type: 'new_job',
      title: `🔔 ${companyName} is hiring`,
      body: `New role: ${data.title}`,
      link: `/jobs/${ref.id}`,
    })
  }

  return ref.id
}

export async function updateJob(jobId, data) {
  const ref = doc(db, 'jobs', jobId)
  const before = await getDoc(ref)

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  })

  if (before.exists()) {
    const prev = before.data()
    if (data.status === 'published' && prev.status !== 'published') {
      await notifyCompanyFollowers(prev.companyId, {
        type: 'new_job',
        title: `🔔 ${prev.companyName} is hiring`,
        body: `New role: ${data.title || prev.title}`,
        link: `/jobs/${jobId}`,
      })
    }
  }
}

export async function deleteJob(jobId) {
  await deleteDoc(doc(db, 'jobs', jobId))
}

export async function getJob(jobId) {
  const snap = await getDoc(doc(db, 'jobs', jobId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function listMyJobs(uid) {
  const q = query(collection(db, 'jobs'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  return sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

export async function listPublishedJobs(max = 50) {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'published'),
    limit(max)
  )
  const snap = await getDocs(q)
  return sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

/**
 * Record a view of a job — dedupes by (user, job) via the jobViews collection.
 * Only signed-in non-owners count. Silently no-ops otherwise.
 */
export async function recordJobView(jobId, userId, ownerId) {
  if (!jobId || !userId) return false
  if (userId === ownerId) return false

  const viewId = `${userId}_${jobId}`
  const viewRef = doc(db, 'jobViews', viewId)

  try {
    const existing = await getDoc(viewRef)
    if (existing.exists()) return false

    await setDoc(viewRef, {
      userId,
      jobId,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'jobs', jobId), {
      views: increment(1),
    })
    return true
  } catch (err) {
    // Silent — analytics should never break the app
    console.warn('recordJobView failed:', err?.message)
    return false
  }
}