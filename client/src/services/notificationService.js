import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const sortByNewest = (items) =>
  items.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0
    const tb = b.createdAt?.seconds || 0
    return tb - ta
  })

/* ============================================================
   1. Single user notification
   ============================================================ */

export async function createNotification({
  userId,
  type = 'system',
  title,
  body,
  link = '',
}) {
  if (!userId || !title) return null
  try {
    const ref = await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      body: body || '',
      link,
      isRead: false,
      createdAt: serverTimestamp(),
    })
    return ref.id
  } catch (err) {
    console.warn('createNotification failed:', err?.message)
    return null
  }
}

/* ============================================================
   2. Admins (used by job/app notifications)
   ============================================================ */

export async function notifyAdmins({ type, title, body, link = '' }) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'))
    const snap = await getDocs(q)
    const admins = snap.docs.map((d) => d.id)
    if (admins.length === 0) return 0

    const batch = writeBatch(db)
    admins.forEach((uid) => {
      const ref = doc(collection(db, 'notifications'))
      batch.set(ref, {
        userId: uid,
        type,
        title,
        body,
        link,
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })
    await batch.commit()
    return admins.length
  } catch (err) {
    console.warn('notifyAdmins failed:', err?.message)
    return 0
  }
}

/* ============================================================
   3. Company followers — used by job posts & company updates
   ============================================================ */

export async function notifyCompanyFollowers(
  companyId,
  { type = 'company_update', title, body, link = '' }
) {
  if (!companyId || !title) return 0
  try {
    const q = query(
      collection(db, 'companyFollowers'),
      where('companyId', '==', companyId)
    )
    const snap = await getDocs(q)
    const followerIds = snap.docs.map((d) => d.data().userId).filter(Boolean)
    if (followerIds.length === 0) return 0

    // Firestore caps at 500 writes per batch
    const CHUNK = 500
    let sent = 0
    for (let i = 0; i < followerIds.length; i += CHUNK) {
      const slice = followerIds.slice(i, i + CHUNK)
      const batch = writeBatch(db)
      slice.forEach((uid) => {
        const ref = doc(collection(db, 'notifications'))
        batch.set(ref, {
          userId: uid,
          type,
          title,
          body,
          link,
          isRead: false,
          createdAt: serverTimestamp(),
        })
      })
      await batch.commit()
      sent += slice.length
    }
    return sent
  } catch (err) {
    console.warn('notifyCompanyFollowers failed:', err?.message)
    return 0
  }
}

/* ============================================================
   4. Platform broadcast — ADMIN ONLY, everyone or filtered
   ============================================================ */

export async function notifyAllUsers({
  title,
  body,
  link = '',
  type = 'platform_announcement',
  role = null,
}) {
  if (!title?.trim() || !body?.trim()) {
    throw new Error('Title and body are required')
  }

  const usersRef = collection(db, 'users')
  const q = role ? query(usersRef, where('role', '==', role)) : usersRef
  const snap = await getDocs(q)
  const userIds = snap.docs.map((d) => d.id)
  if (userIds.length === 0) return { sent: 0 }

  const CHUNK = 500
  let sent = 0
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const slice = userIds.slice(i, i + CHUNK)
    const batch = writeBatch(db)
    slice.forEach((uid) => {
      const ref = doc(collection(db, 'notifications'))
      batch.set(ref, {
        userId: uid,
        type,
        title: title.trim(),
        body: body.trim(),
        link,
        isRead: false,
        createdAt: serverTimestamp(),
      })
    })
    await batch.commit()
    sent += slice.length
  }
  return { sent }
}

/* ============================================================
   5. Read / subscriptions
   ============================================================ */

export function subscribeNotifications(uid, callback) {
  if (!uid) return () => {}
  const q = query(collection(db, 'notifications'), where('userId', '==', uid))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    sortByNewest(items)
    callback(items)
  })
}

export async function markNotificationRead(id) {
  if (!id) return
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true })
  } catch {
    /* best-effort */
  }
}

export async function markAllNotificationsRead(uid) {
  if (!uid) return
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      where('isRead', '==', false)
    )
    const snap = await getDocs(q)
    if (snap.empty) return

    const CHUNK = 500
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += CHUNK) {
      const slice = docs.slice(i, i + CHUNK)
      const batch = writeBatch(db)
      slice.forEach((d) => batch.update(d.ref, { isRead: true }))
      await batch.commit()
    }
  } catch (err) {
    console.warn('markAllNotificationsRead failed:', err?.message)
  }
}
export async function deleteNotification(id) {
  if (!id) return
  try {
    await deleteDoc(doc(db, 'notifications', id))
  } catch (err) {
    console.warn('deleteNotification failed:', err?.message)
  }
}

export async function deleteAllNotifications(uid) {
  if (!uid) return
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', uid))
    const snap = await getDocs(q)
    if (snap.empty) return

    const CHUNK = 500
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += CHUNK) {
      const slice = docs.slice(i, i + CHUNK)
      const batch = writeBatch(db)
      slice.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  } catch (err) {
    console.warn('deleteAllNotifications failed:', err?.message)
  }
}

export function subscribeUnreadNotificationCount(uid, callback) {
  if (!uid) {
    callback(0)
    return () => {}
  }
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', uid),
    where('isRead', '==', false)
  )
  return onSnapshot(q, (snap) => callback(snap.size))
}