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
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { notifyAdmins } from './notificationService'

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Notify admins on publish
  if (data.status === 'published') {
    await notifyAdmins({
      type: 'admin_new_job',
      title: '💼 New job posted',
      body: `${companyName} published "${data.title}".`,
      link: '/admin/jobs',
    })
  }

  return ref.id
}

export async function updateJob(jobId, data) {
  await updateDoc(doc(db, 'jobs', jobId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
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