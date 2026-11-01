import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Fetch job seekers for the Talent Directory.
 * In the future, you can add filters here (skills, location, etc.)
 */
export async function listPublicTalent(max = 20) {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'job_seeker'),
      limit(max)
    )
    const snap = await getDocs(q)
    
    // Filter out users who explicitly set their profile to private
    const users = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.profileVisibility !== 'private')

    return users
  } catch (err) {
    console.warn('listPublicTalent failed:', err?.message)
    return []
  }
}