import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

export const GENERAL_CHANNEL_ID = 'general'
export const GENERAL_CHANNEL_NAME = 'SkillNest Community'
export const GENERAL_CHANNEL_DESC =
  'The official SkillNest community. Everyone is here. Share tips, ask questions, discuss jobs.'

function VIRTUAL_GENERAL() {
  return {
    id: GENERAL_CHANNEL_ID,
    name: GENERAL_CHANNEL_NAME,
    description: GENERAL_CHANNEL_DESC,
    ownerId: 'system',
    ownerName: 'SkillNest',
    memberIds: [],
    memberCount: 0,
    isPrivate: false,
    isGeneral: true,
    lastMessage: '',
    _virtual: true,
  }
}

export function subscribeMyGroups(uid, callback) {
  if (!uid) {
    callback([VIRTUAL_GENERAL()])
    return () => {}
  }

  let generalData = VIRTUAL_GENERAL()
  let privateGroups = []

  const updateCallback = () => {
    const sortedPrivate = [...privateGroups].sort((a, b) => {
      const ta = a.lastMessageAt?.seconds || 0
      const tb = b.lastMessageAt?.seconds || 0
      return tb - ta
    })
    callback([generalData, ...sortedPrivate])
  }

  const unsubGeneral = onSnapshot(
    doc(db, 'communityGroups', GENERAL_CHANNEL_ID),
    (docSnap) => {
      if (docSnap.exists()) {
        generalData = { id: docSnap.id, ...docSnap.data() }
      }
      updateCallback()
    },
    (error) => console.warn("General channel error:", error.message)
  )

  const q = query(
    collection(db, 'communityGroups'),
    where('memberIds', 'array-contains', uid)
  )

  const unsubPrivate = onSnapshot(
    q,
    (snap) => {
      privateGroups = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => g.id !== GENERAL_CHANNEL_ID)
      updateCallback()
    },
    (error) => console.warn("Private groups error:", error.message)
  )

  return () => {
    unsubGeneral()
    unsubPrivate()
  }
}

export async function ensureGeneralMembership(uid) {
  if (!uid) return
  try {
    const ref = doc(db, 'communityGroups', GENERAL_CHANNEL_ID)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        name: GENERAL_CHANNEL_NAME,
        description: GENERAL_CHANNEL_DESC,
        ownerId: 'system',
        ownerName: 'SkillNest',
        memberIds: [uid],
        memberCount: 1,
        isPrivate: false,
        isGeneral: true,
        lastMessage: 'Welcome to the community!',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return
    }
    const members = snap.data().memberIds || []
    if (!members.includes(uid)) {
      await updateDoc(ref, {
        memberIds: [...members, uid],
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (err) {
    console.warn("ensureGeneralMembership failed silently", err.message)
  }
}

// 👇 FIXED MESSAGE SUBSCRIPTION (NO INDEX REQUIRED) 👇
export function subscribeGroupMessages(groupId, callback, max = 50) {
  if (!groupId) return () => {}
  
  // 1. We removed orderBy to prevent the "index required" crash
  const q = query(
    collection(db, 'groupMessages'),
    where('groupId', '==', groupId)
  )
  
  return onSnapshot(q, (snap) => {
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    
    // 2. Sort the messages in JavaScript instead
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    
    // 3. Take the latest 50 and reverse them for the chat UI
    items = items.slice(0, max)
    callback(items.reverse())
  }, (error) => {
    console.warn("Message subscription error:", error.message)
    callback([])
  })
}

// 👇 FIXED SEND MESSAGE (PREVENTS CRASH) 👇
export async function sendGroupMessage({ groupId, senderId, senderName, senderPhotoURL = '', body, attachment = null }) {
  if (!groupId || !senderId || !body?.trim()) return
  const clean = body.trim().slice(0, 4000)

  // 1. Add the message
  const ref = await addDoc(collection(db, 'groupMessages'), {
    groupId,
    senderId,
    senderName: senderName || 'Anonymous',
    senderPhotoURL,
    body: clean,
    attachment,
    createdAt: serverTimestamp(),
  })

  // 2. Update group metadata using setDoc with merge to avoid crash if doc is weird
  try {
    const groupRef = doc(db, 'communityGroups', groupId)
    await setDoc(groupRef, {
      lastMessage: clean.slice(0, 100),
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
      lastSenderName: senderName || 'Anonymous',
    }, { merge: true })
  } catch (err) {
    console.warn("Metadata update failed silently", err.message)
  }

  return ref.id
}

export async function deleteGroupMessage(messageId) {
  await deleteDoc(doc(db, 'groupMessages', messageId))
}

export async function createGroup({ name, description = '', ownerId, ownerName = '', photoURL = '', isPrivate = false, initialMemberIds = [] }) {
  if (!name?.trim() || !ownerId) throw new Error('Missing name or owner')
  const memberIds = Array.from(new Set([ownerId, ...initialMemberIds]))
  const ref = await addDoc(collection(db, 'communityGroups'), {
    name: name.trim().slice(0, 80),
    description: description.trim().slice(0, 300),
    photoURL, ownerId, ownerName, memberIds, memberCount: memberIds.length, isPrivate, isGeneral: false,
    lastMessage: 'Group created', lastMessageAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGroup(groupId, patch) {
  await updateDoc(doc(db, 'communityGroups', groupId), { ...patch, updatedAt: serverTimestamp() })
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'communityGroups', groupId))
}

export async function addGroupMember(groupId, userId) {
  if (!groupId || !userId) return
  try {
    const ref = doc(db, 'communityGroups', groupId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const members = snap.data().memberIds || []
      if (!members.includes(userId)) {
        await updateDoc(ref, { memberIds: [...members, userId], memberCount: increment(1), updatedAt: serverTimestamp() })
      }
    }
  } catch (err) { console.error(err) }
}

export async function removeGroupMember(groupId, userId) {
  if (!groupId || !userId) return
  try {
    const ref = doc(db, 'communityGroups', groupId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const members = snap.data().memberIds || []
      if (members.includes(userId)) {
        await updateDoc(ref, { memberIds: members.filter(id => id !== userId), memberCount: increment(-1), updatedAt: serverTimestamp() })
      }
    }
  } catch (err) { console.error(err) }
}

export async function updateTypingStatus(groupId, userId, userName, isTyping) {
  if (!groupId || !userId) return
  const ref = doc(db, 'communityGroups', groupId, 'typing', userId)
  if (isTyping) await setDoc(ref, { userName, updatedAt: serverTimestamp() })
  else await deleteDoc(ref)
}

export function subscribeToTyping(groupId, callback) {
  const q = collection(db, 'communityGroups', groupId, 'typing')
  return onSnapshot(q, (snap) => {
    const now = Date.now()
    const typingUsers = snap.docs.map(d => d.data()).filter(u => u.updatedAt && (now - u.updatedAt.toMillis() < 5000))
    callback(typingUsers)
  }, (error) => console.warn(error.message))
}

export async function inviteToGroup({ groupId, groupName, invitedUserId, invitedBy, invitedByName }) {
  if (!groupId || !invitedUserId || !invitedBy || invitedUserId === invitedBy) return
  const snap = await getDoc(doc(db, 'communityGroups', groupId))
  if (snap.exists() && (snap.data().memberIds || []).includes(invitedUserId)) return
  
  const q = query(collection(db, 'groupInvites'), where('groupId', '==', groupId), where('invitedUserId', '==', invitedUserId), where('status', '==', 'pending'))
  const existing = await getDocs(q)
  if (!existing.empty) return
  
  await addDoc(collection(db, 'groupInvites'), {
    groupId, groupName: groupName || 'a group', invitedUserId, invitedBy, invitedByName: invitedByName || 'Someone', status: 'pending', createdAt: serverTimestamp(),
  })
  createNotification({ userId: invitedUserId, type: 'group_invite', title: `Invitation to "${groupName || 'a group'}"`, body: `${invitedByName || 'Someone'} invited you to join a group.`, link: `/community?invite=${groupId}` }).catch(() => {})
}

export function subscribeMyInvites(uid, callback) {
  if (!uid) return () => {}
  const q = query(collection(db, 'groupInvites'), where('invitedUserId', '==', uid), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => callback([]))
}

export async function acceptGroupInvite(inviteId) {
  const ref = doc(db, 'groupInvites', inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Invite not found')
  const data = snap.data()
  await addGroupMember(data.groupId, data.invitedUserId) 
  await updateDoc(ref, { status: 'accepted', respondedAt: serverTimestamp() })
  return data.groupId
}

export async function declineGroupInvite(inviteId) {
  await updateDoc(doc(db, 'groupInvites', inviteId), { status: 'declined', respondedAt: serverTimestamp() })
}

import { arrayUnion } from 'firebase/firestore' // Make sure to add this to your imports at the top!

// ... (keep all your existing code above this)

/**
 * ADMIN ONLY: Bulk adds ALL existing users to the general channel
 */
export async function syncAllUsersToGeneralChannel() {
  try {
    // 1. Fetch all users
    const usersSnap = await getDocs(collection(db, 'users'))
    const allUids = usersSnap.docs.map(d => d.id)
    
    if (allUids.length === 0) return { success: true, count: 0 }

    // 2. Chunk them into groups of 500 (Firestore arrayUnion limits)
    const CHUNK_SIZE = 500
    const generalRef = doc(db, 'communityGroups', 'general')
    
    for (let i = 0; i < allUids.length; i += CHUNK_SIZE) {
      const chunk = allUids.slice(i, i + CHUNK_SIZE)
      
      await updateDoc(generalRef, {
        memberIds: arrayUnion(...chunk),
        memberCount: increment(chunk.length)
      })
    }

    return { success: true, count: allUids.length }
  } catch (error) {
    console.error("Failed to sync users:", error)
    return { success: false, error: error.message }
  }
}
export async function editGroupMessage(messageId, newBody) {
  if (!messageId || !newBody?.trim()) return
  try {
    await updateDoc(doc(db, 'groupMessages', messageId), {
      body: newBody.trim(),
      isEdited: true,
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.error("Failed to edit message:", err)
    throw err
  }
}