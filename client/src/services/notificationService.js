import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export async function createNotification({
  userId,
  type,
  title,
  body = '',
  link = '',
}) {
  if (!userId) return
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    link,
    isRead: false,
    createdAt: serverTimestamp(),
  })
}

/**
 * Send a notification to every admin account.
 * Best-effort — errors won't break the calling action.
 */
export async function notifyAdmins({ type, title, body = '', link = '' }) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'))
    const snap = await getDocs(q)
    if (snap.empty) return

    await Promise.all(
      snap.docs.map((d) =>
        addDoc(collection(db, 'notifications'), {
          userId: d.id,
          type,
          title,
          body,
          link,
          isRead: false,
          createdAt: serverTimestamp(),
        })
      )
    )
  } catch (err) {
    console.warn('notifyAdmins failed:', err)
  }
}

export async function listMyNotifications(uid) {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid))
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return items.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })
}

export function subscribeNotifications(uid, callback) {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    callback(items)
  })
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', id), { isRead: true })
}

export async function markAllNotificationsRead(uid) {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid))
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    if (!d.data().isRead) batch.update(d.ref, { isRead: true })
  })
  await batch.commit()
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, 'notifications', id))
}