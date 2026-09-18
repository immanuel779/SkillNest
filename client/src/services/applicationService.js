import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification, notifyAdmins } from './notificationService'
import { isPermissionError } from '../utils/errors'
import { sendEmail } from './emailService'

const sortByCreatedDesc = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })

function statusNotification(status, jobTitle, companyName) {
  const company = companyName || 'The employer'
  switch (status) {
    case 'under_review':
      return {
        title: 'Your application is under review',
        body: `${company} is reviewing your application for "${jobTitle}".`,
      }
    case 'shortlisted':
      return {
        title: "You've been shortlisted!",
        body: `Great news — ${company} shortlisted you for "${jobTitle}".`,
      }
    case 'interview':
      return {
        title: 'Interview stage reached',
        body: `You've progressed to the interview stage for "${jobTitle}" at ${company}.`,
      }
    case 'hired':
      return {
        title: "You've been hired! 🎉",
        body: `Congratulations — ${company} hired you for "${jobTitle}".`,
      }
    case 'rejected':
      return {
        title: 'Application update',
        body: `${company} has moved forward with other candidates for "${jobTitle}".`,
      }
    default:
      return {
        title: 'Application updated',
        body: `Your application for "${jobTitle}" was updated to "${status}".`,
      }
  }
}

export async function listApplicationsForJob(jobId, employerId) {
  try {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      where('employerId', '==', employerId)
    )
    const snap = await getDocs(q)
    return sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}

export async function listMyApplications(uid) {
  try {
    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', uid)
    )
    const snap = await getDocs(q)
    return sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}

export async function getApplication(appId) {
  try {
    const snap = await getDoc(doc(db, 'applications', appId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    if (isPermissionError(err)) return null
    throw err
  }
}

export async function hasApplied(uid, jobId) {
  try {
    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', uid),
      where('jobId', '==', jobId),
      limit(1)
    )
    const snap = await getDocs(q)
    return !snap.empty
  } catch {
    return false
  }
}

export async function createApplication(uid, email, job, data) {
  const now = new Date()
  const ref = await addDoc(collection(db, 'applications'), {
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName,
    applicantId: uid,
    applicantEmail: email,
    employerId: job.ownerId,
    companyId: job.companyId,
    coverLetter: data.coverLetter || '',
    resumeUrl: data.resumeUrl || '',
    resumeName: data.resumeName || '',
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    answers: data.answers || [],
    scorecard: null,
    scorecardAvg: null,
    status: 'applied',
    statusHistory: [
      { status: 'applied', at: now, by: 'candidate' },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  try {
    const jobRef = doc(db, 'jobs', job.id)
    const jobSnap = await getDoc(jobRef)
    if (jobSnap.exists()) {
      const current = jobSnap.data().applicantCount || 0
      await updateDoc(jobRef, { applicantCount: current + 1 })
    }
  } catch {
    /* best-effort */
  }

  try {
    await createNotification({
      userId: job.ownerId,
      type: 'new_application',
      title: 'New application received',
      body: `${email} applied to "${job.title}".`,
      link: `/employer/jobs/${job.id}/applicants`,
    })
  } catch {
    /* best-effort */
  }

  try {
    const employerSnap = await getDoc(doc(db, 'users', job.ownerId))
    const employerEmail = employerSnap.exists()
      ? employerSnap.data().email
      : null
    if (employerEmail) {
      sendEmail('application_received', employerEmail, {
        jobTitle: job.title,
        companyName: job.companyName,
        candidateEmail: email,
      }).catch(() => {})
    }
  } catch {
    /* best-effort */
  }

  try {
    await notifyAdmins({
      type: 'admin_new_application',
      title: '📥 New application on SkillNest',
      body: `${email} applied to "${job.title}" at ${job.companyName}.`,
      link: '/admin/applications',
    })
  } catch {
    /* best-effort */
  }

  return ref.id
}

export async function updateApplicationStatus(appId, status, options = {}) {
  const ref = doc(db, 'applications', appId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const app = snap.data()

  const now = new Date()
  const history = Array.isArray(app.statusHistory) ? app.statusHistory : []

  // Don't double-append if status hasn't changed
  const last = history[history.length - 1]
  const nextHistory =
    last?.status === status
      ? history
      : [
          ...history,
          {
            status,
            at: now,
            by: options.by || 'employer',
            note: options.note || '',
          },
        ]

  await updateDoc(ref, {
    status,
    statusHistory: nextHistory,
    updatedAt: serverTimestamp(),
  })

  try {
    const { title, body } = statusNotification(
      status,
      app.jobTitle,
      app.companyName
    )
    await createNotification({
      userId: app.applicantId,
      type: 'application_status',
      title,
      body,
      link: '/applications',
    })
  } catch {
    /* best-effort */
  }

  try {
    const candidateSnap = await getDoc(doc(db, 'users', app.applicantId))
    const candidateEmail = candidateSnap.exists()
      ? candidateSnap.data().email
      : null
    if (candidateEmail && status !== 'applied') {
      sendEmail('status_change', candidateEmail, {
        status,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
      }).catch(() => {})
    }
  } catch {
    /* best-effort */
  }

  try {
    const emoji =
      { hired: '🎉', rejected: '❌', shortlisted: '⭐', interview: '📅' }[
        status
      ] || '📊'
    await notifyAdmins({
      type: 'admin_status_change',
      title: `${emoji} Application marked as "${status.replace('_', ' ')}"`,
      body: `${app.applicantEmail} → "${app.jobTitle}" at ${app.companyName}.`,
      link: '/admin/applications',
    })
  } catch {
    /* best-effort */
  }
}

export async function getApplicantProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    if (isPermissionError(err)) return null
    throw err
  }
}

export async function saveScorecard(appId, scorecard) {
  const ref = doc(db, 'applications', appId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Application not found')

  const scores = [
    scorecard.technical,
    scorecard.culture,
    scorecard.communication,
  ].filter((s) => typeof s === 'number' && s >= 1 && s <= 5)

  const avg =
    scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : null

  const payload = {
    scorecard: {
      technical: scorecard.technical ?? null,
      culture: scorecard.culture ?? null,
      communication: scorecard.communication ?? null,
      recommendation: scorecard.recommendation || '',
      notes: (scorecard.notes || '').slice(0, 2000),
      updatedAt: new Date(),
    },
    scorecardAvg: avg,
    updatedAt: serverTimestamp(),
  }

  await updateDoc(ref, payload)
  return payload
}