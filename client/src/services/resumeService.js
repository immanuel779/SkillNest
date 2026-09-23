import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/** Get the user's primary resume (or null). */
export async function getMyResume(uid) {
  if (!uid) return null
  try {
    const q = query(collection(db, 'resumes'), where('userId', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return null
    // newest first
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
    return list[0]
  } catch {
    return null
  }
}

/** Create or update the user's resume. */
export async function saveMyResume(uid, data) {
  if (!uid) throw new Error('Not signed in')
  const existing = await getMyResume(uid)

  if (existing?.id) {
    await updateDoc(doc(db, 'resumes', existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return existing.id
  }

  const ref = doc(collection(db, 'resumes'))
  await setDoc(ref, {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Delete a resume. */
export async function deleteResume(id) {
  if (!id) return
  await deleteDoc(doc(db, 'resumes', id))
}

/** Empty starter resume shaped for our form. */
export function emptyResume(profile) {
  const p = profile || {}
  return {
    template: 'modern',
    accentColor: '#6d28d9',
    basics: {
      fullName: p.fullName || '',
      headline: p.headline || '',
      email: p.email || '',
      phone: p.phone || '',
      location: p.location || '',
      website: p.portfolioUrl || '',
      linkedin: p.linkedinUrl || '',
      github: p.githubUrl || '',
    },
    summary: p.about || '',
    experience: (p.experience || []).map((x) => ({
      id: x.id || crypto.randomUUID(),
      title: x.title || '',
      company: x.company || '',
      location: x.location || '',
      startDate: x.startDate || '',
      endDate: x.endDate || '',
      isCurrent: !!x.isCurrent,
      bullets: (x.description || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    })),
    education: (p.education || []).map((x) => ({
      id: x.id || crypto.randomUUID(),
      school: x.school || '',
      degree: x.degree || '',
      field: x.field || '',
      startDate: x.startDate || '',
      endDate: x.endDate || '',
      description: x.description || '',
    })),
    skills: (p.skills || []).map((s) => ({
      id: crypto.randomUUID(),
      name: typeof s === 'string' ? s : s.name || '',
      level: s.level || 'Intermediate',
    })),
    projects: [],
  }
}