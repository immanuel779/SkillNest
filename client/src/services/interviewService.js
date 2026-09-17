import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

const sortByDateAsc = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.scheduledAt?.seconds || 0
    const tb = b.scheduledAt?.seconds || 0
    return ta - tb
  })

export async function createInterview(app, employer, data) {
  const ref = await addDoc(collection(db, 'interviews'), {
    applicationId: app.id,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    companyName: app.companyName,
    candidateId: app.applicantId,
    candidateName: app.applicantName || '',
    candidateEmail: app.applicantEmail || '',
    employerId: employer.uid,
    employerName: employer.fullName || employer.email || '',
    scheduledAt: data.scheduledAt, // ISO string → we store as Firestore Timestamp
    durationMin: Number(data.durationMin) || 30,
    meetingLink: data.meetingLink || '',
    notes: data.notes || '',
    status: 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Notify candidate
  await createNotification({
    userId: app.applicantId,
    type: 'interview',
    title: 'Interview scheduled',
    body: `${employer.fullName || 'The employer'} scheduled an interview for "${app.jobTitle}".`,
    link: '/interviews',
  })

  // Update application status to 'interview' (only if not already hired/rejected)
  if (['applied', 'under_review', 'shortlisted'].includes(app.status)) {
    const appRef = doc(db, 'applications', app.id)
    await updateDoc(appRef, {
      status: 'interview',
      updatedAt: serverTimestamp(),
    })
  }

  return ref.id
}

export async function getInterview(id) {
  const snap = await getDoc(doc(db, 'interviews', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateInterview(id, data) {
  await updateDoc(doc(db, 'interviews', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function listMyInterviews(uid, role) {
  const field = role === 'employer' ? 'employerId' : 'candidateId'
  const q = query(collection(db, 'interviews'), where(field, '==', uid))
  const snap = await getDocs(q)
  return sortByDateAsc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

export async function listInterviewsForApplication(appId) {
  const q = query(
    collection(db, 'interviews'),
    where('applicationId', '==', appId)
  )
  const snap = await getDocs(q)
  return sortByDateAsc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}