import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { reserveSlug } from './slugService'

/**
 * Fetch the current user's company.
 * Self-heals the user doc so existing owners get companyId + teamRole set.
 */
export async function getMyCompany(uid) {
  if (!uid) return null

  const q = query(collection(db, 'companies'), where('ownerId', '==', uid))
  const snap = await getDocs(q)

  if (!snap.empty) {
    const d = snap.docs[0]
    const company = { id: d.id, ...d.data() }

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
      /* best-effort */
    }

    return company
  }

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

/**
 * Look up a company by slug.
 *
 * Tries several slug variations so URLs like:
 *   /c/codecraft
 *   /c/Codecraft
 *   /c/codecraft-technologies
 *   /c/codecrafttechnologies
 * all find the same company.
 *
 * Also falls back to treating the slug as a company doc ID.
 */
export async function getCompanyBySlug(slug) {
  if (!slug) return null

  const raw = slug.toString().trim()

  // Build variations to try
  const variations = new Set()
  variations.add(raw)
  variations.add(raw.toLowerCase())
  variations.add(raw.toLowerCase().replace(/[\s_-]+/g, ''))
  variations.add(raw.toLowerCase().replace(/\s+/g, '-'))
  variations.add(raw.toLowerCase().replace(/_/g, '-'))
  variations.add(raw.toLowerCase().replace(/-/g, ''))

  // Try each variation against the slug field
  for (const v of variations) {
    if (!v) continue
    try {
      const q = query(
        collection(db, 'companies'),
        where('slug', '==', v),
        limit(1)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const d = snap.docs[0]
        return { id: d.id, ...d.data() }
      }
    } catch (err) {
      console.warn('slug lookup failed for', v, err?.message)
    }
  }

  // Fallback: treat the slug as a company ID (in case someone shares /c/{id})
  try {
    const snap = await getDoc(doc(db, 'companies', raw))
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
  } catch {
    /* ignore */
  }

  return null
}

export async function setCompanySlug(companyId, ownerUid, desiredSlug, oldSlug) {
  const finalSlug = await reserveSlug(companyId, desiredSlug, ownerUid)
  await updateCompany(companyId, {
    slug: finalSlug,
    previousSlug: oldSlug || null,
  })
  return finalSlug
}

/* ============================================================
   FOLLOWERS
   ============================================================ */

/** Returns the follower doc id if the user follows the company, else null. */
export async function getFollowDoc(companyId, userId) {
  if (!companyId || !userId) return null
  const q = query(
    collection(db, 'companyFollowers'),
    where('companyId', '==', companyId),
    where('userId', '==', userId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function isFollowingCompany(companyId, userId) {
  const doc = await getFollowDoc(companyId, userId)
  return !!doc
}

/**
 * Follow a company. Idempotent:
 *  - if already following, does nothing
 *  - otherwise creates the follower doc and increments followerCount atomically
 */
export async function followCompany(companyId, userId) {
  if (!companyId || !userId) throw new Error('Missing ids')

  const existing = await getFollowDoc(companyId, userId)
  if (existing) return { alreadyFollowing: true }

  await addDoc(collection(db, 'companyFollowers'), {
    companyId,
    userId,
    createdAt: serverTimestamp(),
  })

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      followerCount: increment(1),
    })
  } catch (err) {
    console.warn('followerCount increment failed:', err?.message)
  }

  return { alreadyFollowing: false }
}

/**
 * Unfollow. Idempotent:
 *  - if not following, does nothing
 *  - otherwise deletes the follower doc and decrements followerCount
 */
export async function unfollowCompany(companyId, userId) {
  if (!companyId || !userId) throw new Error('Missing ids')

  const existing = await getFollowDoc(companyId, userId)
  if (!existing) return { wasFollowing: false }

  await deleteDoc(doc(db, 'companyFollowers', existing.id))

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      followerCount: increment(-1),
    })
  } catch (err) {
    console.warn('followerCount decrement failed:', err?.message)
  }

  return { wasFollowing: true }
}

/**
 * Self-heal: count real follower docs and reconcile the stored followerCount.
 * Call this once from company page load if you suspect drift.
 */
export async function syncFollowerCount(companyId) {
  if (!companyId) return 0
  const q = query(
    collection(db, 'companyFollowers'),
    where('companyId', '==', companyId)
  )
  const snap = await getDocs(q)
  const realCount = snap.size

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      followerCount: realCount,
    })
  } catch {
    /* best-effort */
  }

  return realCount
}

/* ============================================================
   LISTS
   ============================================================ */

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

export async function removeTeamMember(userId) {
  await updateDoc(doc(db, 'users', userId), {
    companyId: null,
    teamRole: null,
    updatedAt: serverTimestamp(),
  })
}

export async function updateTeamRole(userId, role) {
  await updateDoc(doc(db, 'users', userId), {
    teamRole: role,
    updatedAt: serverTimestamp(),
  })
}