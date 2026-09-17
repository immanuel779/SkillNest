import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const id = (uid, companyId) => `${uid}__${companyId}`

export async function isFollowing(uid, companyId) {
  if (!uid || !companyId) return false
  try {
    const snap = await getDoc(doc(db, 'companyFollowers', id(uid, companyId)))
    return snap.exists()
  } catch {
    return false
  }
}

export async function followCompany(uid, companyId) {
  const ref = doc(db, 'companyFollowers', id(uid, companyId))
  const existing = await getDoc(ref)
  if (existing.exists()) return

  await setDoc(ref, {
    userId: uid,
    companyId,
    createdAt: serverTimestamp(),
  })

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      followerCount: increment(1),
    })
  } catch {
    /* best-effort */
  }
}

export async function unfollowCompany(uid, companyId) {
  const ref = doc(db, 'companyFollowers', id(uid, companyId))
  const existing = await getDoc(ref)
  if (!existing.exists()) return

  await deleteDoc(ref)

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      followerCount: increment(-1),
    })
  } catch {
    /* best-effort */
  }
}