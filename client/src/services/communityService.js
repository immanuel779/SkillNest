import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/* ============================================================
   COMMUNITY POSTS (Paginated & Real-time)
   ============================================================ */
export function subscribeCommunityPosts({ max = 20, tag = null }, callback) {
  let q
  
  if (tag && tag !== 'general') {
    q = query(
      collection(db, 'communityPosts'),
      where('tag', '==', tag),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(max)
    )
  } else {
    q = query(
      collection(db, 'communityPosts'),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(max)
    )
  }

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, (error) => {
    console.warn("Posts subscription error:", error)
    callback([])
  })
}

// For infinite scrolling
export async function loadMoreCommunityPosts({ lastVisibleDoc, max = 20, tag = null }) {
  let q
  if (tag && tag !== 'general') {
    q = query(
      collection(db, 'communityPosts'),
      where('tag', '==', tag),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisibleDoc),
      limit(max)
    )
  } else {
    q = query(
      collection(db, 'communityPosts'),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisibleDoc),
      limit(max)
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createCommunityPost({
  authorId,
  authorName,
  authorPhotoURL = '',
  authorRole = 'job_seeker',
  body,
  tag = 'general',
  attachment = null,
}) {
  if (!body?.trim() || !authorId) throw new Error('Missing data')

  const ref = await addDoc(collection(db, 'communityPosts'), {
    authorId,
    authorName: authorName || 'Anonymous',
    authorPhotoURL,
    authorRole,
    body: body.trim().slice(0, 2000),
    tag: tag || 'general',
    attachment,
    likes: 0,
    replyCount: 0,
    hidden: false,
    flagged: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/* ============================================================
   LIKES (Secure & Tracked)
   ============================================================ */
export async function toggleLikePost(postId, userId) {
  if (!postId || !userId) return false
  
  // Use a composite ID to ensure a user can only like once
  const likeId = `${postId}_${userId}`
  const likeRef = doc(db, 'communityPostLikes', likeId)
  const snap = await getDoc(likeRef)

  if (snap.exists()) {
    // User already liked it, so unlike it
    await deleteDoc(likeRef)
    await updateDoc(doc(db, 'communityPosts', postId), {
      likes: increment(-1),
    }).catch(() => {})
    return false // returned state: isLiked
  } else {
    // User hasn't liked it, so add a like
    await setDoc(likeRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'communityPosts', postId), {
      likes: increment(1),
    }).catch(() => {})
    return true // returned state: isLiked
  }
}

/* ============================================================
   REPLIES
   ============================================================ */
export function subscribePostReplies(postId, callback) {
  if (!postId) return () => {}
  const q = query(
    collection(db, 'communityReplies'),
    where('postId', '==', postId),
    where('hidden', '==', false),
    orderBy('createdAt', 'asc') // Oldest first for threading
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function createCommunityReply({
  postId,
  authorId,
  authorName,
  authorPhotoURL = '',
  authorRole = 'job_seeker',
  body,
}) {
  if (!postId || !body?.trim() || !authorId) throw new Error('Missing data')

  const ref = await addDoc(collection(db, 'communityReplies'), {
    postId,
    authorId,
    authorName: authorName || 'Anonymous',
    authorPhotoURL,
    authorRole,
    body: body.trim().slice(0, 1000),
    hidden: false,
    createdAt: serverTimestamp(),
  })

  // Increment reply count on the parent post
  await updateDoc(doc(db, 'communityPosts', postId), {
    replyCount: increment(1),
  }).catch(() => {})

  return ref.id
}

export async function deleteCommunityReply(replyId, postId) {
  await deleteDoc(doc(db, 'communityReplies', replyId))
  if (postId) {
    await updateDoc(doc(db, 'communityPosts', postId), {
      replyCount: increment(-1),
    }).catch(() => {})
  }
}

/* ============================================================
   MODERATION & TAGS
   ============================================================ */
export async function deleteCommunityPost(postId) {
  await deleteDoc(doc(db, 'communityPosts', postId))
}

export async function hideCommunityPost(postId, hidden = true) {
  await updateDoc(doc(db, 'communityPosts', postId), {
    hidden,
    updatedAt: serverTimestamp(),
  })
}

export async function flagCommunityPost(postId) {
  await updateDoc(doc(db, 'communityPosts', postId), {
    flagged: true,
    updatedAt: serverTimestamp(),
  })
}

export const COMMUNITY_TAGS = [
  { v: 'general', l: 'General', icon: '💬' },
  { v: 'ngojobs', l: 'NGO Jobs', icon: '🌱' },
  { v: 'remotework', l: 'Remote Work', icon: '🏡' },
  { v: 'graduatetrainee', l: 'Graduate Trainee', icon: '🎓' },
  { v: 'salarytips', l: 'Salary Tips', icon: '💰' },
  { v: 'cvhelp', l: 'CV Help', icon: '📄' },
  { v: 'oilandgas', l: 'Oil & Gas', icon: '⚙️' },
  { v: 'bankjobs', l: 'Bank Jobs', icon: '🏦' },
  { v: 'lagosjobs', l: 'Lagos Jobs', icon: '📍' },
]