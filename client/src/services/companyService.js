import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { reserveSlug } from './slugService'

export async function getMyCompany(uid) {
  const q = query(collection(db, 'companies'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function createCompany(uid, data) {
  const ref = await addDoc(collection(db, 'companies'), {
    ...data,
    ownerId: uid,
    followerCount: 0,
    viewCount: 0,
    verified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCompany(companyId, data) {
  await updateDoc(doc(db, 'companies', companyId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getCompany(companyId) {
  const snap = await getDoc(doc(db, 'companies', companyId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getCompanyBySlug(slug) {
  if (!slug) return null
  const q = query(
    collection(db, 'companies'),
    where('slug', '==', slug),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

/** Reserve a slug and save it to the company doc in one call. */
export async function setCompanySlug(companyId, ownerUid, desiredSlug, oldSlug) {
  const finalSlug = await reserveSlug(companyId, desiredSlug, ownerUid)
  await updateCompany(companyId, {
    slug: finalSlug,
    previousSlug: oldSlug || null,
  })
  return finalSlug
}

/**
 * Fetch top companies for the landing page.
 * Sorted by follower count, then by name.
 */
export async function listFeaturedCompanies(max = 6) {
  try {
    const snap = await getDocs(collection(db, 'companies'))
    const companies = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => c.slug)

    companies.sort((a, b) => {
      const fa = a.followerCount || 0
      const fb = b.followerCount || 0
      if (fb !== fa) return fb - fa
      return (a.name || '').localeCompare(b.name || '')
    })

    return companies.slice(0, max)
  } catch {
    return []
  }
}

/**
 * Fetch every company that has a public slug.
 * Returns them sorted by follower count (descending), then name.
 */
export async function listAllPublicCompanies() {
  try {
    const snap = await getDocs(collection(db, 'companies'))
    const companies = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => c.slug)

    companies.sort((a, b) => {
      const fa = a.followerCount || 0
      const fb = b.followerCount || 0
      if (fb !== fa) return fb - fa
      return (a.name || '').localeCompare(b.name || '')
    })

    return companies
  } catch {
    return []
  }
}