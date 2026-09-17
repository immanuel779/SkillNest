import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const sortDesc = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })

export async function createUpdate(companyId, authorId, content, imageUrl = null) {
  if (!content?.trim()) throw new Error('Update content cannot be empty.')
  if (content.length > 280) throw new Error('Update must be 280 characters or fewer.')

  const ref = await addDoc(collection(db, 'companyUpdates'), {
    companyId,
    authorId,
    content: content.trim(),
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCompanyUpdate(updateId, content) {
  await updateDoc(doc(db, 'companyUpdates', updateId), {
    content: content.trim().slice(0, 280),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCompanyUpdate(updateId) {
  await deleteDoc(doc(db, 'companyUpdates', updateId))
}

export async function listCompanyUpdates(companyId, limitCount = 30) {
  try {
    const q = query(
      collection(db, 'companyUpdates'),
      where('companyId', '==', companyId)
    )
    const snap = await getDocs(q)
    return sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).slice(0, limitCount)
  } catch (err) {
    if (err.message?.toLowerCase().includes('permissions')) return []
    throw err
  }
}

export async function getCompanyUpdate(updateId) {
  const snap = await getDoc(doc(db, 'companyUpdates', updateId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}