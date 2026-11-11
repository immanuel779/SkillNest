import { 
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, 
  query, where, orderBy, serverTimestamp, increment 
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Helper to create a URL-friendly slug from the title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function listPublishedBlogPosts() {
  try {
    const q = query(
      collection(db, 'blogPosts'),
      where('published', '==', true)
    )
    const snap = await getDocs(q)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Sort newest first
    items.sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0))
    return items
  } catch (err) {
    console.warn('Failed to fetch posts:', err)
    return []
  }
}

export async function listAllBlogPosts() {
  try {
    const snap = await getDocs(collection(db, 'blogPosts'))
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    return items
  } catch (err) {
    console.warn('Failed to fetch all posts:', err)
    return []
  }
}

export async function getBlogPost(postId) {
  try {
    const snap = await getDoc(doc(db, 'blogPosts', postId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch {
    return null
  }
}

export async function createBlogPost(data, authorName, authorId) {
  const ref = await addDoc(collection(db, 'blogPosts'), {
    ...data,
    slug: createSlug(data.title),
    authorName,
    authorId,
    views: 0,
    published: data.published ?? false,
    publishedAt: data.published ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBlogPost(postId, data) {
  const payload = {
    ...data,
    slug: createSlug(data.title),
    updatedAt: serverTimestamp(),
  }
  
  // If it's being published for the first time, set the publishedAt date
  if (data.published) {
    const current = await getBlogPost(postId)
    if (!current.publishedAt) {
      payload.publishedAt = serverTimestamp()
    }
  }

  await updateDoc(doc(db, 'blogPosts', postId), payload)
}

export async function deleteBlogPost(postId) {
  await deleteDoc(doc(db, 'blogPosts', postId))
}

export async function incrementBlogViews(postId) {
  try {
    await updateDoc(doc(db, 'blogPosts', postId), { views: increment(1) })
  } catch { /* silent */ }
}