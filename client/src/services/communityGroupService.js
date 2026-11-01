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
  limit,
  orderBy,
  startAfter,
  serverTimestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

/* ============================================================
   SPECIAL CHANNEL
   ============================================================ */
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

/* ============================================================
   SUBSCRIBE TO GROUPS (Scalable: Only fetches user's groups)
   ============================================================ */
export function subscribeMyGroups(uid, callback) {
  if (!uid) {
    callback([VIRTUAL_GENERAL()])
    return () => {}
  }

  // 1. Query for groups the user is a member of
  const q = query(
    collection(db, 'communityGroups'),
    where('memberIds', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  )

  const unsub = onSnapshot(
    q,
    (snap) => {
      const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      // 2. Always add the general channel at the top
      const hasGeneral = groups.some((g) => g.id === GENERAL_CHANNEL_ID)
      
      // Fetch general channel if it exists in DB
      if (!hasGeneral) {
        getDoc(doc(db, 'communityGroups', GENERAL_CHANNEL_ID)).then(gSnap => {
          if (gSnap.exists()) {
             const generalData = { id: gSnap.id, ...gSnap.data() }
             callback([generalData, ...groups])
          } else {
             callback([VIRTUAL_GENERAL(), ...groups])
          }
        }).catch(() => {
          callback([VIRTUAL_GENERAL(), ...groups])
        })
      } else {
        // Sort general to top
        groups.sort((a, b) => {
          if (a.id === GENERAL_CHANNEL_ID) return -1
          if (b.id === GENERAL_CHANNEL_ID) return 1
          return 0
        })
        callback(groups)
      }
    },
    (error) => {
      console.warn("Groups subscription error:", error)
      callback([VIRTUAL_GENERAL()])
    }
  )

  return unsub
}

/* ============================================================
   CREATE / UPDATE / DELETE GROUP
   ============================================================ */
export async function createGroup({
  name,
  description = '',
  ownerId,
  ownerName = '',
  photoURL = '',
  isPrivate = false,
  initialMemberIds = [],
}) {
  if (!name?.trim() || !ownerId) throw new Error('Missing name or owner')
  const memberIds = Array.from(new Set([ownerId, ...initialMemberIds]))

  const ref = await addDoc(collection(db, 'communityGroups'), {
    name: name.trim().slice(0, 80),
    description: description.trim().slice(0, 300),
    photoURL,
    ownerId,
    ownerName,
    memberIds,
    memberCount: memberIds.length,
    isPrivate,
    isGeneral: false,
    lastMessage: 'Group created',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

export async function updateGroup(groupId, patch) {
  await updateDoc(doc(db, 'communityGroups', groupId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'communityGroups', groupId))
}

/* ============================================================
   MEMBERSHIP & TYPING INDICATORS
   ============================================================ */
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
    console.warn("ensureGeneralMembership failed silently", err)
  }
}

// ─── NEW: ADD MEMBER ───
export async function addGroupMember(groupId, userId) {
  if (!groupId || !userId) return
  try {
    const ref = doc(db, 'communityGroups', groupId)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      const members = snap.data().memberIds || []
      if (!members.includes(userId)) {
        await updateDoc(ref, {
          memberIds: [...members, userId],
          memberCount: increment(1),
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (err) {
    console.error("Error adding member to group:", err)
    throw err
  }
}

// ─── NEW: REMOVE MEMBER ───
export async function removeGroupMember(groupId, userId) {
  if (!groupId || !userId) return
  try {
    const ref = doc(db, 'communityGroups', groupId)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      const members = snap.data().memberIds || []
      if (members.includes(userId)) {
        await updateDoc(ref, {
          memberIds: members.filter(id => id !== userId),
          memberCount: increment(-1),
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (err) {
    console.error("Error removing member from group:", err)
    throw err
  }
}

// Typing Indicators
export async function updateTypingStatus(groupId, userId, userName, isTyping) {
  if (!groupId || !userId) return
  const ref = doc(db, 'communityGroups', groupId, 'typing', userId)
  if (isTyping) {
    await setDoc(ref, { userName, updatedAt: serverTimestamp() })
  } else {
    await deleteDoc(ref)
  }
}

export function subscribeToTyping(groupId, callback) {
  const q = collection(db, 'communityGroups', groupId, 'typing')
  return onSnapshot(q, (snap) => {
    const now = Date.now()
    const typingUsers = snap.docs
      .map(d => d.data())
      // Filter out stale typing statuses (older than 5 seconds)
      .filter(u => u.updatedAt && (now - u.updatedAt.toMillis() < 5000))
    callback(typingUsers)
  })
}

/* ============================================================
   INVITES
   ============================================================ */
export async function inviteToGroup({ groupId, groupName, invitedUserId, invitedBy, invitedByName }) {
  if (!groupId || !invitedUserId || !invitedBy) return
  if (invitedUserId === invitedBy) return

  // Check if already a member
  const snap = await getDoc(doc(db, 'communityGroups', groupId))
  if (snap.exists() && (snap.data().memberIds || []).includes(invitedUserId)) return

  // Check for existing pending invite
  const q = query(
    collection(db, 'groupInvites'),
    where('groupId', '==', groupId),
    where('invitedUserId', '==', invitedUserId),
    where('status', '==', 'pending')
  )
  const existing = await getDocs(q)
  if (!existing.empty) return

  await addDoc(collection(db, 'groupInvites'), {
    groupId,
    groupName: groupName || 'a group',
    invitedUserId,
    invitedBy,
    invitedByName: invitedByName || 'Someone',
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  createNotification({
    userId: invitedUserId,
    type: 'group_invite',
    title: `Invitation to "${groupName || 'a group'}"`,
    body: `${invitedByName || 'Someone'} invited you to join a group.`,
    link: `/community?invite=${groupId}`,
  }).catch(() => {})
}

export function subscribeMyInvites(uid, callback) {
  if (!uid) return () => {}
  const q = query(
    collection(db, 'groupInvites'),
    where('invitedUserId', '==', uid),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, () => callback([]))
}

export async function acceptGroupInvite(inviteId) {
  const ref = doc(db, 'groupInvites', inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Invite not found')

  const data = snap.data()
  
  // NOW THIS WILL WORK BECAUSE addGroupMember IS DEFINED ABOVE
  await addGroupMember(data.groupId, data.invitedUserId) 
  
  await updateDoc(ref, { status: 'accepted', respondedAt: serverTimestamp() })
  return data.groupId
}

export async function declineGroupInvite(inviteId) {
  await updateDoc(doc(db, 'groupInvites', inviteId), {
    status: 'declined',
    respondedAt: serverTimestamp(),
  })
}

/* ============================================================
   MESSAGES (Paginated & Real-time)
   ============================================================ */
export function subscribeGroupMessages(groupId, callback, max = 50) {
  if (!groupId) return () => {}
  
  // Fetch the LATEST 50 messages
  const q = query(
    collection(db, 'groupMessages'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  
  return onSnapshot(q, (snap) => {
    // Reverse because Firestore gives us newest first, but UI needs oldest at top
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
    callback(items)
  }, (error) => {
    console.warn("Message subscription error:", error)
    callback([])
  })
}

// For loading older messages when scrolling up
export async function loadMoreGroupMessages(groupId, lastVisibleDoc, max = 50) {
  if (!groupId || !lastVisibleDoc) return []
  const q = query(
    collection(db, 'groupMessages'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc'),
    startAfter(lastVisibleDoc),
    limit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
}

export async function sendGroupMessage({ groupId, senderId, senderName, senderPhotoURL = '', body, attachment = null }) {
  if (!groupId || !senderId || !body?.trim()) return
  const clean = body.trim().slice(0, 4000)

  const ref = await addDoc(collection(db, 'groupMessages'), {
    groupId,
    senderId,
    senderName: senderName || 'Anonymous',
    senderPhotoURL,
    body: clean,
    attachment,
    createdAt: serverTimestamp(),
  })

  // Update group metadata for the sidebar
  await updateDoc(doc(db, 'communityGroups', groupId), {
    lastMessage: clean.slice(0, 100),
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    lastSenderName: senderName || 'Anonymous',
  }).catch(() => {})

  return ref.id
}

export async function deleteGroupMessage(messageId) {
  await deleteDoc(doc(db, 'groupMessages', messageId))
}