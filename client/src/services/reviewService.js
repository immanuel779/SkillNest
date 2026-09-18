import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Submit a review for a company. Starts as 'pending' until auto/manual approved.
 * Reviews are anonymous — authorId is stored but never shown publicly.
 */
export async function createReview({
  companyId,
  companyOwnerId,
  authorId,
  rating,
  title,
  body,
  interviewedRole,
}) {
  if (!companyId || !authorId) throw new Error('Missing company or author')
  if (!rating || rating < 1 || rating > 5) throw new Error('Rating is required')

  const ref = await addDoc(collection(db, 'companyReviews'), {
    companyId,
    companyOwnerId,
    authorId,
    rating: Number(rating),
    title: (title || '').slice(0, 120),
    body: (body || '').slice(0, 2000),
    interviewedRole: (interviewedRole || '').slice(0, 120),
    status: 'pending', // pending | approved | rejected
    employerReply: null,
    employerRepliedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Reviews go live immediately in MVP (auto-approve).
  await updateDoc(ref, { status: 'approved' })

  return ref.id
}

export async function listCompanyReviews(companyId) {
  try {
    const q = query(
      collection(db, 'companyReviews'),
      where('companyId', '==', companyId),
      where('status', '==', 'approved')
    )
    const snap = await getDocs(q)
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    reviews.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    return reviews
  } catch {
    return []
  }
}

export async function getReviewStats(companyId) {
  const reviews = await listCompanyReviews(companyId)
  if (reviews.length === 0) {
    return { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }
  const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0)
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach((r) => {
    const n = Math.round(r.rating)
    if (dist[n] !== undefined) dist[n]++
  })
  return {
    count: reviews.length,
    average: Number((sum / reviews.length).toFixed(1)),
    distribution: dist,
  }
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, 'companyReviews', reviewId))
}

export async function replyToReview(reviewId, reply) {
  await updateDoc(doc(db, 'companyReviews', reviewId), {
    employerReply: (reply || '').slice(0, 800),
    employerRepliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Has the current user already reviewed this company?
 */
export async function hasReviewed(companyId, authorId) {
  if (!companyId || !authorId) return false
  try {
    const q = query(
      collection(db, 'companyReviews'),
      where('companyId', '==', companyId),
      where('authorId', '==', authorId)
    )
    const snap = await getDocs(q)
    return !snap.empty
  } catch {
    return false
  }
}

/**
 * Check if a user has any application that reached interview stage for a company.
 */
export async function canReviewCompany(companyId, userId) {
  if (!companyId || !userId) return false
  try {
    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', userId),
      where('companyId', '==', companyId)
    )
    const snap = await getDocs(q)
    return snap.docs.some((d) => {
      const s = d.data().status
      return s === 'interview' || s === 'hired'
    })
  } catch {
    return false
  }
}