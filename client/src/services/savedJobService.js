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
  // Rules may block this for non-owners — treat as "not saved"
  try {
    const id = `${uid}_${jobId}`
    const snap = await getDoc(doc(db, 'savedJobs', id))
    return snap.exists()
  } catch {
    return false
  }
}

export async function listMySavedJobs(uid) {
  const q = query(collection(db, 'savedJobs'), where('userId', '==', uid))
  const snap = await getDocs(q)
  const saved = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (saved.length === 0) return []

  const jobs = await Promise.all(
    saved.map(async (s) => {
      try {
        const j = await getDoc(doc(db, 'jobs', s.jobId))
        return j.exists() ? { id: j.id, ...j.data(), savedId: s.id } : null
      } catch {
        return null
      }
    })
  )

  return jobs.filter(Boolean)
}