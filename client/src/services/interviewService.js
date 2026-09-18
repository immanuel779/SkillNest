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
import { sendEmail } from './emailService'

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
    scheduledAt: data.scheduledAt,
    durationMin: Number(data.durationMin) || 30,
    meetingLink: data.meetingLink || '',
    notes: data.notes || '',
    status: 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // In-app notification to candidate
  try {
    await createNotification({
      userId: app.applicantId,
      type: 'interview',
      title: 'Interview scheduled',
      body: `${employer.fullName || 'The employer'} scheduled an interview for "${app.jobTitle}".`,
      link: '/interviews',
    })
  } catch {
    /* best-effort */
  }

  // Email the candidate
  try {
    const candidateSnap = await getDoc(doc(db, 'users', app.applicantId))
    const candidateEmail = candidateSnap.exists()
      ? candidateSnap.data().email
      : app.applicantEmail
    if (candidateEmail) {
      const when = data.scheduledAt
        ? new Date(data.scheduledAt).toLocaleString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : ''
      sendEmail('interview_scheduled', candidateEmail, {
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        whenText: when,
        durationMin: data.durationMin || 30,
        meetingLink: data.meetingLink || '',
      }).catch(() => {})
    }
  } catch {
    /* best-effort */
  }

  // Update application status to 'interview' (only if not already hired/rejected)
  try {
    if (['applied', 'under_review', 'shortlisted'].includes(app.status)) {
      const appRef = doc(db, 'applications', app.id)
      await updateDoc(appRef, {
        status: 'interview',
        updatedAt: serverTimestamp(),
      })
    }
  } catch {
    /* best-effort */
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