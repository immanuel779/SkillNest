import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Subscribe an email to the SkillNest weekly job alerts newsletter.
 * Idempotent — silently succeeds if already subscribed.
 * Returns { ok, alreadySubscribed }.
 */
export async function subscribeToNewsletter(email) {
  const clean = String(email || '').trim().toLowerCase()
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error('Please enter a valid email address.')
  }

  // Check for existing subscription
  try {
    const q = query(
      collection(db, 'newsletterSubscribers'),
      where('email', '==', clean),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { ok: true, alreadySubscribed: true }
    }
  } catch {
    /* fall through to create */
  }

  await addDoc(collection(db, 'newsletterSubscribers'), {
    email: clean,
    source: 'landing',
    subscribedAt: serverTimestamp(),
    status: 'active',
  })

  return { ok: true, alreadySubscribed: false }
}