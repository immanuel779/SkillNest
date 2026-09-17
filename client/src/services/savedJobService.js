import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { isPermissionError } from '../utils/errors'

export async function saveJob(uid, jobId) {
  const id = `${uid}_${jobId}`
  await setDoc(doc(db, 'savedJobs', id), {
    userId: uid,
    jobId,
    createdAt: serverTimestamp(),
  })
  return id
}

export async function unsaveJob(uid, jobId) {
  const id = `${uid}_${jobId}`
  await deleteDoc(doc(db, 'savedJobs', id))
}

export async function isJobSaved(uid, jobId) {
  try {
    const id = `${uid}_${jobId}`
    const snap = await getDoc(doc(db, 'savedJobs', id))
    return snap.exists()
  } catch (err) {
    if (isPermissionError(err)) return false
    throw err
  }
}

export async function listMySavedJobs(uid) {
  try {
    const q = query(collection(db, 'savedJobs'), where('userId', '==', uid))
    const snap = await getDocs(q)
    const saved = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    if (saved.length === 0) return []

    const jobs = await Promise.all(
      saved.map(async (s) => {
        try {
          const j = await getDoc(doc(db, 'jobs', s.jobId))
          return j.exists() ? { id: j.id, ...j.data(), savedId: s.id } : null
        } catch (err) {
          if (isPermissionError(err)) return null
          throw err
        }
      })
    )

    return jobs.filter(Boolean)
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}