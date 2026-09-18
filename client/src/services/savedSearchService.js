import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Save the current job-search filters for a user.
 */
export async function createSavedSearch(uid, name, filters) {
  if (!uid) throw new Error('Not signed in')
  if (!name?.trim()) throw new Error('Give your search a name')

  const ref = await addDoc(collection(db, 'savedSearches'), {
    userId: uid,
    name: name.trim().slice(0, 60),
    q: filters.q || '',
    location: filters.location || '',
    jobType: filters.jobType || '',
    workMode: filters.workMode || '',
    experienceLevel: filters.experienceLevel || '',
    category: filters.category || '',
    enabled: true,
    lastAlertAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function listMySavedSearches(uid) {
  if (!uid) return []
  try {
    const snap = await getDocs(
      query(collection(db, 'savedSearches'), where('userId', '==', uid))
    )
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    return items
  } catch {
    return []
  }
}

export async function toggleSavedSearch(searchId, enabled) {
  await updateDoc(doc(db, 'savedSearches', searchId), {
    enabled: !!enabled,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSavedSearch(searchId) {
  await deleteDoc(doc(db, 'savedSearches', searchId))
}

export async function markSearchAlerted(searchId) {
  await updateDoc(doc(db, 'savedSearches', searchId), {
    lastAlertAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Match a job against a saved search's filters.
 * All filters are AND-combined.
 */
export function matchesSearch(job, search) {
  if (!job) return false

  // Only match published jobs
  if (job.status !== 'published') return false

  const q = (search.q || '').trim().toLowerCase()
  if (q) {
    const hay = [
      job.title,
      job.description,
      job.companyName,
      ...(job.skills || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!hay.includes(q)) return false
  }

  if (search.location) {
    const needle = search.location.toLowerCase()
    if (!(job.location || '').toLowerCase().includes(needle)) return false
  }

  if (search.jobType && job.jobType !== search.jobType) return false
  if (search.workMode && job.workMode !== search.workMode) return false
  if (search.experienceLevel && job.experienceLevel !== search.experienceLevel)
    return false
  if (search.category && job.category !== search.category) return false

  return true
}

/**
 * Build a URL query string from a saved search's filters.
 * Used to open the search on the /jobs page.
 */
export function searchToQueryString(search) {
  const params = new URLSearchParams()
  if (search.q) params.set('q', search.q)
  if (search.location) params.set('location', search.location)
  if (search.jobType) params.set('jobType', search.jobType)
  if (search.workMode) params.set('workMode', search.workMode)
  if (search.experienceLevel)
    params.set('experienceLevel', search.experienceLevel)
  if (search.category) params.set('category', search.category)
  return params.toString()
}