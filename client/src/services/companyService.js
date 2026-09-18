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

/**
 * Fetch the current user's company.
 * Self-heals the user doc so existing owners get companyId + teamRole set.
 */
export async function getMyCompany(uid) {
  if (!uid) return null

  // 1) Does this user own a company?
  const q = query(collection(db, 'companies'), where('ownerId', '==', uid))
  const snap = await getDocs(q)

  if (!snap.empty) {
    const d = snap.docs[0]
    const company = { id: d.id, ...d.data() }

    // Backfill the owner's user doc if companyId / teamRole are missing
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data() || {}
        if (
          userData.companyId !== company.id ||
          userData.teamRole !== 'owner'
        ) {
          await updateDoc(userRef, {
            companyId: company.id,
            teamRole: 'owner',
            updatedAt: serverTimestamp(),
          })
        }
      }
    } catch {
      /* best-effort — don't block the caller */
    }

    return company
  }

  // 2) Fall back to companyId on the user doc (recruiters/viewers)
  try {
    const userSnap = await getDoc(doc(db, 'users', uid))
    const companyId = userSnap.exists() ? userSnap.data().companyId : null
    if (companyId) {
      const cSnap = await getDoc(doc(db, 'companies', companyId))
      return cSnap.exists() ? { id: cSnap.id, ...cSnap.data() } : null
    }
  } catch {
    /* ignore */
  }

  return null
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

  // Tag the owner on their user doc so rules can check membership
  try {
    await updateDoc(doc(db, 'users', uid), {
      companyId: ref.id,
      teamRole: 'owner',
      updatedAt: serverTimestamp(),
    })
  } catch {
    /* best-effort */
  }

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

/**
 * List all members of a company (users whose companyId matches).
 * Owner first, then recruiters, then viewers.
 */
export async function listTeamMembers(companyId) {
  try {
    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId)
    )
    const snap = await getDocs(q)
    const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const order = { owner: 0, recruiter: 1, viewer: 2 }
    return members.sort((a, b) => {
      const oa = order[a.teamRole] ?? 99
      const ob = order[b.teamRole] ?? 99
      if (oa !== ob) return oa - ob
      return (a.fullName || '').localeCompare(b.fullName || '')
    })
  } catch {
    return []
  }
}

/** Remove a team member (unset companyId + teamRole on their user doc). */
export async function removeTeamMember(userId) {
  await updateDoc(doc(db, 'users', userId), {
    companyId: null,
    teamRole: null,
    updatedAt: serverTimestamp(),
  })
}

/** Change a member's role. */
export async function updateTeamRole(userId, role) {
  await updateDoc(doc(db, 'users', userId), {
    teamRole: role,
    updatedAt: serverTimestamp(),
  })
}