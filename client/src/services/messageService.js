import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

function conversationId(employerId, candidateId, jobId) {
  return `${employerId}__${candidateId}__${jobId}`
}

export async function ensureConversation({
  employerId,
  candidateId,
  jobId,
  jobTitle,
  employerName,
  candidateName,
  candidateEmail,
}) {
  if (!employerId || !candidateId || !jobId) {
    throw new Error('Missing required fields to start conversation')
  }

  const id = conversationId(employerId, candidateId, jobId)
  const ref = doc(db, 'conversations', id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const existing = snap.data()
    const patch = {}
    if (employerName && !existing.employerName) patch.employerName = employerName
    if (candidateName && !existing.candidateName) patch.candidateName = candidateName
    if (candidateEmail && !existing.candidateEmail) patch.candidateEmail = candidateEmail
    if (Object.keys(patch).length > 0) {
      try {
        await updateDoc(ref, patch)
      } catch {
        /* best-effort */
      }
    }
    return id
  }

  await setDoc(ref, {
    employerId,
    candidateId,
    jobId,
    jobTitle: jobTitle || '',
    employerName: employerName || '',
    candidateName: candidateName || '',
    candidateEmail: candidateEmail || '',
    participants: [employerId, candidateId],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastSenderId: '',
    createdAt: serverTimestamp(),
  })
  return id
}

export async function sendMessage({
  conversationId: convId,
  senderId,
  recipientId,
  body,
}) {
  if (!body.trim()) return
  const ref = await addDoc(collection(db, 'messages'), {
    conversationId: convId,
    senderId,
    recipientId,
    body: body.trim(),
    isRead: false,
    createdAt: serverTimestamp(),
  })

  try {
    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: body.trim().slice(0, 120),
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
    })
  } catch {
    /* best-effort */
  }

  try {
    await createNotification({
      userId: recipientId,
      type: 'message',
      title: 'New message',
      body: body.trim().slice(0, 80),
      link: `/messages?c=${convId}`,
    })
  } catch {
    /* best-effort */
  }

  return ref.id
}

export async function listMyConversations(uid) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return items.sort((a, b) => {
    const ta = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0
    const tb = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0
    return tb - ta
  })
}

export function subscribeConversations(uid, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid)
  )
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0
      const tb = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0
      return tb - ta
    })
    callback(items)
  })
}

export function subscribeMessages(convId, callback) {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', convId)
  )
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return ta - tb
    })
    callback(items)
  })
}

export async function markConversationRead(convId, uid) {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', convId)
  )
  const snap = await getDocs(q)
  const unread = snap.docs.filter(
    (d) => d.data().recipientId === uid && !d.data().isRead
  )
  await Promise.all(unread.map((d) => updateDoc(d.ref, { isRead: true })))
}

export function subscribeUnreadMessageCount(uid, callback) {
  const q = query(
    collection(db, 'messages'),
    where('recipientId', '==', uid)
  )
  return onSnapshot(q, (snap) => {
    const unread = snap.docs.filter((d) => !d.data().isRead).length
    callback(unread)
  })
}

/**
 * Subscribe to unread messages grouped by conversation.
 * Calls `callback` with a map: { [conversationId]: unreadCount }
 */
export function subscribeUnreadByConversation(uid, callback) {
  const q = query(
    collection(db, 'messages'),
    where('recipientId', '==', uid),
    where('isRead', '==', false)
  )
  return onSnapshot(q, (snap) => {
    const map = {}
    snap.docs.forEach((d) => {
      const m = d.data()
      const cid = m.conversationId
      if (!cid) return
      map[cid] = (map[cid] || 0) + 1
    })
    callback(map)
  })
}