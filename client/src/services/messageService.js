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
import { sendEmail } from './emailService'

/* ============================================================
   RATE LIMITING (client-side, per user)
   ============================================================ */

const RATE_LIMITS = {
  burst: { max: 10, windowMs: 30 * 1000 },
  hourly: { max: 200, windowMs: 60 * 60 * 1000 },
}

const RATE_KEY = (uid) => `skillnest_msgRate_${uid}`

function readRate(uid) {
  if (!uid) return []
  try {
    const raw = localStorage.getItem(RATE_KEY(uid))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeRate(uid, timestamps) {
  try {
    localStorage.setItem(RATE_KEY(uid), JSON.stringify(timestamps))
  } catch {
    /* silent */
  }
}

function enforceRateLimit(uid) {
  if (!uid) return
  const now = Date.now()
  const all = readRate(uid)
  const hourAgo = now - RATE_LIMITS.hourly.windowMs
  const recent = all.filter((t) => t > hourAgo)

  const burstCount = recent.filter(
    (t) => t > now - RATE_LIMITS.burst.windowMs
  ).length

  if (burstCount >= RATE_LIMITS.burst.max) {
    const oldest = recent.find((t) => t > now - RATE_LIMITS.burst.windowMs)
    const waitSec = Math.max(
      1,
      Math.ceil((oldest + RATE_LIMITS.burst.windowMs - now) / 1000)
    )
    const err = new Error(
      `Slow down — you're sending messages too fast. Try again in ${waitSec}s.`
    )
    err.code = 'RATE_LIMIT_BURST'
    throw err
  }

  if (recent.length >= RATE_LIMITS.hourly.max) {
    const oldest = recent[0]
    const waitMin = Math.max(
      1,
      Math.ceil((oldest + RATE_LIMITS.hourly.windowMs - now) / 60000)
    )
    const err = new Error(
      `You've hit the hourly message limit. Try again in ${waitMin} min.`
    )
    err.code = 'RATE_LIMIT_HOURLY'
    throw err
  }

  recent.push(now)
  writeRate(uid, recent)
}

/* ============================================================
   CONVERSATIONS + MESSAGES
   ============================================================ */

function conversationId(employerId, candidateId, jobId) {
  return `${employerId}__${candidateId}__${jobId}`
}

const sortByLastActivity = (items) =>
  items.sort((a, b) => {
    const ta = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0
    const tb = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0
    return tb - ta
  })

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
    if (candidateName && !existing.candidateName)
      patch.candidateName = candidateName
    if (candidateEmail && !existing.candidateEmail)
      patch.candidateEmail = candidateEmail
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
  if (!body?.trim()) return

  const clean = body.trim().slice(0, 5000)

  enforceRateLimit(senderId)

  const ref = await addDoc(collection(db, 'messages'), {
    conversationId: convId,
    senderId,
    recipientId,
    body: clean,
    isRead: false,
    createdAt: serverTimestamp(),
  })

  try {
    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: clean.slice(0, 120),
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
      body: clean.slice(0, 80),
      link: `/messages?c=${convId}`,
    })
  } catch {
    /* best-effort */
  }

  try {
    const recipientSnap = await getDoc(doc(db, 'users', recipientId))
    if (recipientSnap.exists()) {
      const recipient = recipientSnap.data()
      if (recipient.email && recipient.notifyMessages !== false) {
        sendEmail('new_message', recipient.email, {
          senderName: 'A SkillNest user',
          preview: clean.slice(0, 140),
        }).catch(() => {})
      }
    }
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
  return sortByLastActivity(items)
}

export function subscribeConversations(uid, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid)
  )
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    sortByLastActivity(items)
    callback(items)
  })
}

export function subscribeAllConversations(callback) {
  const q = query(collection(db, 'conversations'))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      sortByLastActivity(items)
      callback(items)
    },
    (err) => {
      console.warn('subscribeAllConversations failed:', err?.message)
      callback([])
    }
  )
}

export function subscribeAllUnreadByConversation(callback) {
  const q = query(collection(db, 'messages'), where('isRead', '==', false))
  return onSnapshot(
    q,
    (snap) => {
      const map = {}
      snap.docs.forEach((d) => {
        const m = d.data()
        const cid = m.conversationId
        if (!cid) return
        map[cid] = (map[cid] || 0) + 1
      })
      callback(map)
    },
    (err) => {
      console.warn('subscribeAllUnreadByConversation failed:', err?.message)
      callback({})
    }
  )
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
  const q = query(collection(db, 'messages'), where('recipientId', '==', uid))
  return onSnapshot(q, (snap) => {
    const unread = snap.docs.filter((d) => !d.data().isRead).length
    callback(unread)
  })
}

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

export async function getChatParticipantProfile(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch {
    return null
  }
}

export async function setTyping(convId, uid, name = '') {
  if (!convId || !uid) return
  try {
    await updateDoc(doc(db, 'conversations', convId), {
      typing: { uid, name, timestamp: Date.now() },
    })
  } catch {
    /* silent */
  }
}

export async function clearTyping(convId, uid) {
  if (!convId || !uid) return
  try {
    const ref = doc(db, 'conversations', convId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    if (snap.data()?.typing?.uid === uid) {
      await updateDoc(ref, { typing: null })
    }
  } catch {
    /* silent */
  }
}